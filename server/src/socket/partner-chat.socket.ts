import type {
  Server as HttpServer,
} from "node:http";

import {
  createAdapter,
} from "@socket.io/redis-adapter";

import {
  Redis,
} from "ioredis";

import {
  Server,
  type Socket,
} from "socket.io";

import {
  z,
} from "zod";

import {
  env,
} from "../config/env.js";

import {
  loadChatIdentity,
  verifyPartnerChatSocketToken,
} from "../services/partner-chat-auth.service.js";

import {
  createPartnerChatMessage,
  createChatPublicKey,
  deletePartnerChatMessage,
  editPartnerChatMessage,
  markPartnerChatRead,
  toChatParticipant,
  type ChatIdentity,
  type ChatParticipant,
  type PartnerChatMessage,
} from "../services/partner-chat.service.js";

const CHAT_SOCKET_ROOM =
  "partner-chat:baki-digital-partners";

const ADMIN_NOTIFICATION_ROOM =
  "partner-operations:admins";

let distributedRateLimitRedis:
  Redis |
  null =
  null;

let rateLimitRedisErrorLogged =
  false;

const typingStartSchema =
  z.object({});

const messageSendSchema =
  z.object({
    clientMessageId:
      z.string().uuid(),

    message:
      z
        .string()
        .trim()
        .min(1)
        .max(4000),

    replyToMessageId:
      z.string().uuid().nullable().optional(),
  });

const messageEditSchema =
  z.object({
    messageId:
      z.string().uuid(),

    message:
      z
        .string()
        .trim()
        .min(1)
        .max(4000),
  });

const messageDeleteSchema =
  z.object({
    messageId:
      z.string().uuid(),
  });

type LocalizedMessage = {
  en:
    string;

  am:
    string;
};

type SocketSuccess<T> = {
  ok:
    true;

  data:
    T;
};

type SocketFailure = {
  ok:
    false;

  error: {
    code:
      string;

    message:
      LocalizedMessage;
  };
};

type SocketAck<T> = (
  response:
    | SocketSuccess<T>
    | SocketFailure,
) => void;

type PresencePayload = {
  onlineCount:
    number;

  participants:
    ChatParticipant[];
};

type TypingStartPayload = {
  typingSessionId:
    string;

  participant:
    ChatParticipant;
};

type TypingStopPayload = {
  typingSessionId:
    string;

  participantKey:
    string;
};

type ServerToClientEvents = {
  "admin:reports:changed": (
    payload: {
      reportId:
        string;

      createdAt:
        string;
    },
  ) => void;

  "admin:chat-reports:changed": (
    payload: {
      reportId: string;
      createdAt: string;
    },
  ) => void;

  "chat:message:new": (
    message:
      PartnerChatMessage,
  ) => void;

  "chat:message:edit": (
    message:
      PartnerChatMessage,
  ) => void;

  "chat:message:delete": (
    message:
      PartnerChatMessage,
  ) => void;

  "chat:typing:start": (
    payload:
      TypingStartPayload,
  ) => void;

  "chat:typing:stop": (
    payload:
      TypingStopPayload,
  ) => void;

  "chat:presence:update": (
    payload:
      PresencePayload,
  ) => void;

  "chat:read:update": (
    payload: {
      participantKey:
        string;

      readAt:
        string;
    },
  ) => void;

  "chat:unread:update": (
    payload: {
      unreadCount:
        number | null;

      reason:
        "message" |
        "delete" |
        "read";
    },
  ) => void;
};

type ClientToServerEvents = {
  "chat:message:send": (
    payload:
      unknown,
    ack:
      SocketAck<PartnerChatMessage>,
  ) => void;

  "chat:message:edit": (
    payload:
      unknown,
    ack:
      SocketAck<PartnerChatMessage>,
  ) => void;

  "chat:message:delete": (
    payload:
      unknown,
    ack:
      SocketAck<PartnerChatMessage>,
  ) => void;

  "chat:typing:start": (
    payload?:
      unknown,
  ) => void;

  "chat:typing:stop": () => void;

  "chat:read": (
    ack?:
      SocketAck<{
        unreadCount:
          number;

        readAt:
          string;
      }>,
  ) => void;
};

type InterServerEvents =
  Record<
    string,
    never
  >;

type SocketData = {
  identity:
    ChatIdentity;

  typing:
    boolean;

  lastTypingEventAt:
    number;

  rateWindows:
    Record<
      string,
      number[]
    >;
};

type ChatSocket =
  Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;

type ChatServer =
  Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;

let activeChatServer:
  ChatServer |
  null =
  null;

export async function getPartnerChatOnlineSummary() {
  if (
    !activeChatServer
  ) {
    return null;
  }

  try {
    const sockets =
      await activeChatServer
        .in(
          CHAT_SOCKET_ROOM,
        )
        .fetchSockets();

    const users =
      new Set<string>();

    const partners =
      new Set<string>();

    for (
      const socket of
      sockets
    ) {
      const identity =
        socket.data
          .identity;

      if (
        !identity
      ) {
        continue;
      }

      users.add(
        identity.publicKey,
      );

      if (
        identity.role ===
        "representative"
      ) {
        partners.add(
          identity.publicKey,
        );
      }
    }

    return {
      onlineUsers:
        users.size,

      onlinePartners:
        partners.size,
    };
  } catch (
    error
  ) {
    console.error(
      "Unable to read Partner Chat presence for analytics:",
      error instanceof
        Error
        ? error.message
        : "Unknown presence error.",
    );

    return null;
  }
}

export function emitAdminReportsChanged(
  payload: {
    reportId:
      string;

    createdAt:
      string;
  },
) {
  activeChatServer
    ?.to(
      ADMIN_NOTIFICATION_ROOM,
    )
    .emit(
      "admin:reports:changed",
      payload,
    );
}

export function emitAdminChatReportsChanged(
  payload: {
    reportId: string;
    createdAt: string;
  },
) {
  activeChatServer
    ?.to(ADMIN_NOTIFICATION_ROOM)
    .emit("admin:chat-reports:changed", payload);
}

export function disconnectRepresentativeFromPartnerChat(
  representativeId: string,
) {
  if (!activeChatServer) {
    return;
  }

  const identity: ChatIdentity = {
    id: representativeId,
    role: "representative",
    name: "",
    reference: null,
    publicKey: createChatPublicKey("representative", representativeId),
    avatarUrl: null,
    sessionVersion: null,
    performance: null,
  };

  void activeChatServer
    .in(userRoom(identity))
    .disconnectSockets(true);
}

function localized(
  en:
    string,

  am:
    string,
): LocalizedMessage {
  return {
    en,
    am,
  };
}

function failure(
  code:
    string,

  message:
    LocalizedMessage,
): SocketFailure {
  return {
    ok:
      false,

    error: {
      code,
      message,
    },
  };
}

async function consumeRateLimit(
  socket:
    ChatSocket,

  key:
    string,

  limit:
    number,

  windowMs:
    number,
) {
  const now =
    Date.now();

  const recent =
    (
      socket.data
        .rateWindows[key] ??
      []
    ).filter(
      (
        timestamp,
      ) =>
        timestamp >
        now -
          windowMs,
    );

  if (
    recent.length >=
    limit
  ) {
    socket.data
      .rateWindows[key] =
      recent;

    return false;
  }

  recent.push(
    now,
  );

  socket.data
    .rateWindows[key] =
    recent;

  if (
    distributedRateLimitRedis
  ) {
    try {
      const count =
        Number(
          await distributedRateLimitRedis.eval(
            `
              local count = redis.call('INCR', KEYS[1])
              if count == 1 then
                redis.call('PEXPIRE', KEYS[1], ARGV[1])
              end
              return count
            `,
            1,
            `partner-chat:rate:${key}:${socket.data.identity.publicKey}`,
            windowMs,
          ),
        );

      return count <=
        limit;
    } catch (
      error
    ) {
      if (
        !rateLimitRedisErrorLogged
      ) {
        rateLimitRedisErrorLogged =
          true;

        console.error(
          "Partner Chat distributed rate limit failed; using the per-socket guard:",
          error instanceof
            Error
            ? error.message
            : "Unknown Redis rate limit error.",
        );
      }
    }
  }

  return true;
}

function userRoom(
  identity:
    ChatIdentity,
) {
  return `partner-chat:user:${identity.publicKey}`;
}

export async function createPartnerChatSocketServer(
  httpServer:
    HttpServer,
) {
  const io:
    ChatServer =
    new Server(
      httpServer,
      {
        cors: {
          origin:
            env.FRONTEND_URL,

          credentials:
            true,

          methods: [
            "GET",
            "POST",
          ],
        },

        transports: [
          "websocket",
        ],

        maxHttpBufferSize:
          16 *
          1024,

        pingInterval:
          25_000,

        pingTimeout:
          20_000,
      },
    );

  activeChatServer =
    io;

  let distributedRealtimeReady =
    false;

  if (
    env.REDIS_URL
  ) {
    try {
      const publisher =
        new Redis(
          env.REDIS_URL,
          {
            lazyConnect:
              true,

            maxRetriesPerRequest:
              null,

            retryStrategy: (
              attempts:
                number,
            ) =>
              Math.min(
                attempts *
                  250,
                5_000,
              ),
          },
        );

      const subscriber =
        publisher.duplicate();

      await Promise.all([
        publisher.connect(),
        subscriber.connect(),
      ]);

      io.adapter(
        createAdapter(
          publisher,
          subscriber,
        ),
      );

      distributedRateLimitRedis =
        publisher;

      distributedRealtimeReady =
        true;
    } catch (
      error
    ) {
      console.error(
        "Partner Chat Redis adapter failed to initialize:",
        error instanceof
          Error
          ? error.message
          : "Unknown Redis error.",
      );
    }
  } else if (
    env.NODE_ENV ===
    "production"
  ) {
    console.error(
      "REDIS_URL is required for production Partner Chat fan-out.",
    );
  }

  io.use(
    async (
      socket,
      next,
    ) => {
      try {
        if (
          env.NODE_ENV ===
            "production" &&
          !distributedRealtimeReady
        ) {
          next(
            new Error(
              "CHAT_REALTIME_UNAVAILABLE",
            ),
          );

          return;
        }

        const token =
          typeof socket
            .handshake
            .auth?.token ===
          "string"
            ? socket.handshake
                .auth.token
            : "";

        if (
          !token
        ) {
          next(
            new Error(
              "CHAT_AUTH_REQUIRED",
            ),
          );

          return;
        }

        const identity =
          await verifyPartnerChatSocketToken(
            token,
          );

        if (
          !identity
        ) {
          next(
            new Error(
              "CHAT_AUTH_INVALID",
            ),
          );

          return;
        }

        socket.data.identity =
          identity;

        socket.data.typing =
          false;

        socket.data.lastTypingEventAt =
          0;

        socket.data.rateWindows =
          {};

        next();
      } catch (
        error
      ) {
        console.error(
          "Partner Chat socket authentication error:",
          error instanceof
            Error
            ? error.message
            : "Unknown authentication error.",
        );

        next(
          new Error(
            "CHAT_AUTH_INVALID",
          ),
        );
      }
    },
  );

  const typingTimers =
    new Map<
      string,
      ReturnType<
        typeof setTimeout
      >
    >();

  let presenceTimer:
    ReturnType<
      typeof setTimeout
    > |
    null =
    null;

  async function broadcastPresence() {
    try {
      const sockets =
        await io
          .in(
            CHAT_SOCKET_ROOM,
          )
          .fetchSockets();

      const participants =
        new Map<
          string,
          ChatParticipant
        >();

      for (
        const connected
        of sockets
      ) {
        const identity =
          connected.data
            .identity;

        if (
          identity
        ) {
          participants.set(
            identity.publicKey,
            toChatParticipant(
              identity,
            ),
          );
        }
      }

      io.to(
        CHAT_SOCKET_ROOM,
      ).emit(
        "chat:presence:update",
        {
          onlineCount:
            participants.size,

          participants:
            Array.from(
              participants.values(),
            ),
        },
      );
    } catch (
      error
    ) {
      console.error(
        "Unable to broadcast Partner Chat presence:",
        error instanceof
          Error
          ? error.message
          : "Unknown presence error.",
      );
    }
  }

  function schedulePresenceBroadcast() {
    if (
      presenceTimer
    ) {
      clearTimeout(
        presenceTimer,
      );
    }

    presenceTimer =
      setTimeout(
        () => {
          presenceTimer =
            null;

          void broadcastPresence();
        },
        100,
      );
  }

  function stopTyping(
    socket:
      ChatSocket,
  ) {
    const timer =
      typingTimers.get(
        socket.id,
      );

    if (
      timer
    ) {
      clearTimeout(
        timer,
      );

      typingTimers.delete(
        socket.id,
      );
    }

    if (
      !socket.data.typing
    ) {
      return;
    }

    socket.data.typing =
      false;

    socket.to(
      CHAT_SOCKET_ROOM,
    ).emit(
      "chat:typing:stop",
      {
        typingSessionId:
          socket.id,

        participantKey:
          socket.data
            .identity
            .publicKey,
      },
    );
  }

  io.on(
    "connection",
    async (
      rawSocket,
    ) => {
      const socket =
        rawSocket as ChatSocket;

      let identity =
        socket.data.identity;

      async function refreshIdentity() {
        const current =
          await loadChatIdentity({
            id:
              identity.id,
            role:
              identity.role,

            sessionVersion:
              identity.role ===
                "representative"
                ? identity.sessionVersion ??
                  undefined
                : undefined,
          });

        if (
          !current
        ) {
          return null;
        }

        identity =
          current;
        socket.data.identity =
          current;

        return current;
      }

      const rooms = [
        CHAT_SOCKET_ROOM,
        userRoom(
          identity,
        ),
      ];

      if (
        identity.role ===
        "admin"
      ) {
        rooms.push(
          ADMIN_NOTIFICATION_ROOM,
        );
      }

      await socket.join(
        rooms,
      );

      schedulePresenceBroadcast();

      const identityTimer =
        setInterval(
          () => {
            void refreshIdentity()
              .then(
                (
                  current,
                ) => {
                  if (
                    !current
                  ) {
                    stopTyping(
                      socket,
                    );
                    socket.disconnect(
                      true,
                    );
                  }
                },
              )
              .catch(
                () => {
                  // A transient database failure should not force a valid user offline.
                },
              );
          },
          5 *
            60 *
            1000,
        );

      socket.on(
        "chat:message:send",
        async (
          payload,
          ack,
        ) => {
          if (
            !await refreshIdentity()
          ) {
            ack(
              failure(
                "CHAT_AUTH_INVALID",
                localized(
                  "Your Partner Chat access is no longer active.",
                  "የPartner Chat መዳረሻዎ ከእንግዲህ ንቁ አይደለም።",
                ),
              ),
            );
            socket.disconnect(
              true,
            );
            return;
          }

          if (
            !await consumeRateLimit(
              socket,
              "message-send",
              20,
              60_000,
            )
          ) {
            ack(
              failure(
                "CHAT_RATE_LIMITED",
                localized(
                  "You are sending messages too quickly. Please wait a moment.",
                  "መልዕክቶችን በጣም ፈጥነው እየላኩ ነው። እባክዎ ትንሽ ይጠብቁ።",
                ),
              ),
            );

            return;
          }

          const parsed =
            messageSendSchema.safeParse(
              payload,
            );

          if (
            !parsed.success
          ) {
            ack(
              failure(
                "CHAT_MESSAGE_INVALID",
                localized(
                  "Write a message between 1 and 4,000 characters.",
                  "ከ1 እስከ 4,000 ፊደላት ያለው መልዕክት ይጻፉ።",
                ),
              ),
            );

            return;
          }

          try {
            const message =
              await createPartnerChatMessage({
                identity,
                clientMessageId:
                  parsed.data
                    .clientMessageId,
                message:
                  parsed.data.message,
                replyToMessageId:
                  parsed.data
                    .replyToMessageId ??
                  null,
              });

            stopTyping(
              socket,
            );

            io.to(
              CHAT_SOCKET_ROOM,
            ).emit(
              "chat:message:new",
              message,
            );

            io.to(
              CHAT_SOCKET_ROOM,
            ).emit(
              "chat:unread:update",
              {
                unreadCount:
                  null,
                reason:
                  "message",
              },
            );

            ack({
              ok:
                true,
              data:
                message,
            });
          } catch (
            error
          ) {
            ack(
              failure(
                "CHAT_MESSAGE_FAILED",
                localized(
                  error instanceof
                    Error
                    ? error.message
                    : "Unable to send the message.",
                  "መልዕክቱን መላክ አልተቻለም።",
                ),
              ),
            );
          }
        },
      );

      socket.on(
        "chat:message:edit",
        async (
          payload,
          ack,
        ) => {
          if (
            !await refreshIdentity()
          ) {
            ack(
              failure(
                "CHAT_AUTH_INVALID",
                localized(
                  "Your Partner Chat access is no longer active.",
                  "የPartner Chat መዳረሻዎ ከእንግዲህ ንቁ አይደለም።",
                ),
              ),
            );
            socket.disconnect(
              true,
            );
            return;
          }

          if (
            !await consumeRateLimit(
              socket,
              "message-edit",
              30,
              60_000,
            )
          ) {
            ack(
              failure(
                "CHAT_RATE_LIMITED",
                localized(
                  "Too many message edits. Please wait a moment.",
                  "ብዙ መልዕክቶችን አርትዖት አድርገዋል። እባክዎ ትንሽ ይጠብቁ።",
                ),
              ),
            );

            return;
          }

          const parsed =
            messageEditSchema.safeParse(
              payload,
            );

          if (
            !parsed.success
          ) {
            ack(
              failure(
                "CHAT_MESSAGE_INVALID",
                localized(
                  "Enter a valid message edit.",
                  "ትክክለኛ የመልዕክት ማሻሻያ ያስገቡ።",
                ),
              ),
            );

            return;
          }

          try {
            const message =
              await editPartnerChatMessage({
                identity,
                messageId:
                  parsed.data.messageId,
                message:
                  parsed.data.message,
              });

            io.to(
              CHAT_SOCKET_ROOM,
            ).emit(
              "chat:message:edit",
              message,
            );

            ack({
              ok:
                true,
              data:
                message,
            });
          } catch (
            error
          ) {
            ack(
              failure(
                "CHAT_EDIT_FORBIDDEN",
                localized(
                  error instanceof
                    Error
                    ? error.message
                    : "Unable to edit the message.",
                  "መልዕክቱን ማስተካከል አልተቻለም።",
                ),
              ),
            );
          }
        },
      );

      socket.on(
        "chat:message:delete",
        async (
          payload,
          ack,
        ) => {
          if (
            !await refreshIdentity()
          ) {
            ack(
              failure(
                "CHAT_AUTH_INVALID",
                localized(
                  "Your Partner Chat access is no longer active.",
                  "የPartner Chat መዳረሻዎ ከእንግዲህ ንቁ አይደለም።",
                ),
              ),
            );
            socket.disconnect(
              true,
            );
            return;
          }

          if (
            !await consumeRateLimit(
              socket,
              "message-delete",
              30,
              60_000,
            )
          ) {
            ack(
              failure(
                "CHAT_RATE_LIMITED",
                localized(
                  "Too many delete attempts. Please wait a moment.",
                  "ብዙ የመሰረዝ ሙከራዎች ተደርገዋል። እባክዎ ትንሽ ይጠብቁ።",
                ),
              ),
            );

            return;
          }

          const parsed =
            messageDeleteSchema.safeParse(
              payload,
            );

          if (
            !parsed.success
          ) {
            ack(
              failure(
                "CHAT_MESSAGE_INVALID",
                localized(
                  "Invalid message.",
                  "መልዕክቱ ትክክል አይደለም።",
                ),
              ),
            );

            return;
          }

          try {
            const message =
              await deletePartnerChatMessage({
                identity,
                messageId:
                  parsed.data.messageId,
              });

            io.to(
              CHAT_SOCKET_ROOM,
            ).emit(
              "chat:message:delete",
              message,
            );

            io.to(
              CHAT_SOCKET_ROOM,
            ).emit(
              "chat:unread:update",
              {
                unreadCount:
                  null,
                reason:
                  "delete",
              },
            );

            ack({
              ok:
                true,
              data:
                message,
            });
          } catch (
            error
          ) {
            ack(
              failure(
                "CHAT_DELETE_FORBIDDEN",
                localized(
                  error instanceof
                    Error
                    ? error.message
                    : "Unable to delete the message.",
                  "መልዕክቱን መሰረዝ አልተቻለም።",
                ),
              ),
            );
          }
        },
      );

      socket.on(
        "chat:typing:start",
        (
          payload,
        ) => {
          if (
            !typingStartSchema.safeParse(
              payload ??
                {},
            ).success
          ) {
            return;
          }

          const now =
            Date.now();

          if (
            now -
              socket.data
                .lastTypingEventAt <
            750
          ) {
            return;
          }

          socket.data.lastTypingEventAt =
            now;

          socket.data.typing =
            true;

          socket.to(
            CHAT_SOCKET_ROOM,
          ).emit(
            "chat:typing:start",
            {
              typingSessionId:
                socket.id,

              participant:
                toChatParticipant(
                  identity,
                ),
            },
          );

          const previous =
            typingTimers.get(
              socket.id,
            );

          if (
            previous
          ) {
            clearTimeout(
              previous,
            );
          }

          typingTimers.set(
            socket.id,
            setTimeout(
              () => {
                stopTyping(
                  socket,
                );
              },
              6_000,
            ),
          );
        },
      );

      socket.on(
        "chat:typing:stop",
        () => {
          stopTyping(
            socket,
          );
        },
      );

      socket.on(
        "chat:read",
        async (
          ack,
        ) => {
          try {
            if (
              !await refreshIdentity()
            ) {
              ack?.(
                failure(
                  "CHAT_AUTH_INVALID",
                  localized(
                    "Your Partner Chat access is no longer active.",
                    "የPartner Chat መዳረሻዎ ከእንግዲህ ንቁ አይደለም።",
                  ),
                ),
              );
              socket.disconnect(
                true,
              );
              return;
            }

            const readState =
              await markPartnerChatRead(
                identity,
              );

            io.to(
              userRoom(
                identity,
              ),
            ).emit(
              "chat:unread:update",
              {
                unreadCount:
                  0,
                reason:
                  "read",
              },
            );

            socket.to(
              CHAT_SOCKET_ROOM,
            ).emit(
              "chat:read:update",
              {
                participantKey:
                  identity.publicKey,

                readAt:
                  readState.readAt,
              },
            );

            ack?.({
              ok:
                true,
              data: {
                unreadCount:
                  0,

                readAt:
                  readState.readAt,
              },
            });
          } catch {
            ack?.(
              failure(
                "CHAT_READ_FAILED",
                localized(
                  "Unable to save your chat read state.",
                  "የChat ንባብ ሁኔታዎን ማስቀመጥ አልተቻለም።",
                ),
              ),
            );
          }
        },
      );

      socket.on(
        "disconnecting",
        () => {
          stopTyping(
            socket,
          );
        },
      );

      socket.on(
        "disconnect",
        () => {
          clearInterval(
            identityTimer,
          );

          schedulePresenceBroadcast();
        },
      );
    },
  );

  return io;
}
