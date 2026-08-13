import {
  io,
  type Socket,
} from "socket.io-client";

import {
  getPartnerChatSession,
  type PartnerChatMessage,
  type PartnerChatParticipant,
  type PartnerChatRole,
  type PartnerChatSession,
} from "@/lib/partner-chat-api";

type Language =
  | "en"
  | "am";

export type PartnerChatSocketFailure = {
  ok:
    false;

  error: {
    code:
      string;

    message: {
      en:
        string;

      am:
        string;
    };
  };
};

export type PartnerChatSocketResult<T> =
  | {
      ok:
        true;

      data:
        T;
    }
  | PartnerChatSocketFailure;

type ServerToClientEvents = {
  "admin:chat-reports:changed": (
    payload: {
      reportId: string;
      createdAt: string;
    },
  ) => void;

  "admin:reports:changed": (
    payload: {
      reportId:
        string;

      createdAt:
        string;
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
    payload: {
      typingSessionId:
        string;

      participant:
        PartnerChatParticipant;
    },
  ) => void;

  "chat:typing:stop": (
    payload: {
      typingSessionId:
        string;

      participantKey:
        string;
    },
  ) => void;

  "chat:presence:update": (
    payload: {
      onlineCount:
        number;

      participants:
        PartnerChatParticipant[];
    },
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
    payload: {
      clientMessageId:
        string;

      message:
        string;

      replyToMessageId:
        string | null;
    },
    ack: (
      result:
        PartnerChatSocketResult<PartnerChatMessage>,
    ) => void,
  ) => void;

  "chat:message:edit": (
    payload: {
      messageId:
        string;

      message:
        string;
    },
    ack: (
      result:
        PartnerChatSocketResult<PartnerChatMessage>,
    ) => void,
  ) => void;

  "chat:message:delete": (
    payload: {
      messageId:
        string;
    },
    ack: (
      result:
        PartnerChatSocketResult<PartnerChatMessage>,
    ) => void,
  ) => void;

  "chat:typing:start": (
    payload?:
      Record<string, never>,
  ) => void;

  "chat:typing:stop": () => void;

  "chat:read": (
    ack?: (
      result:
        PartnerChatSocketResult<{
          unreadCount:
            number;

          readAt:
            string;
        }>,
    ) => void,
  ) => void;
};

export type PartnerChatSocket =
  Socket<
    ServerToClientEvents,
    ClientToServerEvents
  >;

type Connection = {
  socket:
    PartnerChatSocket;

  session:
    PartnerChatSession;

  getPresence: () => {
    onlineCount:
      number;

    participants:
      PartnerChatParticipant[];
  };
};

const connections =
  new Map<
    PartnerChatRole,
    Promise<Connection>
  >();

function getSocketUrl() {
  const explicit =
    process.env
      .NEXT_PUBLIC_CHAT_SOCKET_URL
      ?.trim();

  if (
    explicit
  ) {
    return explicit.replace(
      /\/$/,
      "",
    );
  }

  const apiUrl =
    process.env
      .NEXT_PUBLIC_API_URL
      ?.trim();

  if (
    apiUrl &&
    /^https?:\/\//i.test(
      apiUrl,
    )
  ) {
    return apiUrl.replace(
      /\/$/,
      "",
    );
  }

  throw new Error(
    "NEXT_PUBLIC_CHAT_SOCKET_URL is required when NEXT_PUBLIC_API_URL uses a relative proxy path.",
  );
}

function createConnection(
  role:
    PartnerChatRole,

  language:
    Language,
) {
  return getPartnerChatSession(
    role,
    language,
  ).then(
    (
      session,
    ) => {
      const socket:
        PartnerChatSocket =
        io(
          getSocketUrl(),
          {
            path:
              "/socket.io",

            autoConnect:
              false,

            transports: [
              "polling",
              "websocket",
            ],

            withCredentials:
              true,

            auth: {
              token:
                session.socketToken,
            },

            reconnection:
              true,

            reconnectionDelay:
              1_000,

            reconnectionDelayMax:
              30_000,

            randomizationFactor:
              0.35,

            timeout:
              12_000,
          },
        );

      let refreshingToken =
        false;

      let latestPresence: {
        onlineCount: number;
        participants: PartnerChatParticipant[];
      } = {
        onlineCount:
          0,
        participants:
          [],
      };

      socket.on(
        "chat:presence:update",
        (
          presence,
        ) => {
          latestPresence =
            presence;
        },
      );

      async function refreshAuthentication() {
        if (
          refreshingToken
        ) {
          return;
        }

        refreshingToken =
          true;

        try {
          const refreshed =
            await getPartnerChatSession(
              role,
              language,
            );

          socket.auth = {
            token:
              refreshed.socketToken,
          };

          if (
            !socket.connected
          ) {
            socket.connect();
          }
        } finally {
          refreshingToken =
            false;
        }
      }

      socket.on(
        "connect_error",
        (
          error,
        ) => {
          const shouldRefresh =
            error.message ===
              "CHAT_AUTH_INVALID" ||
            error.message ===
              "CHAT_AUTH_REQUIRED";

          if (
            !shouldRefresh ||
            refreshingToken
          ) {
            return;
          }

          void refreshAuthentication().catch(
            () => {
              // REST authorization errors are surfaced by the portal session UI.
            },
          );
        },
      );

      socket.on(
        "disconnect",
        (
          reason,
        ) => {
          if (
            reason ===
            "io server disconnect"
          ) {
            void refreshAuthentication().catch(
              () => {
                // The user may have lost Chat access; do not create a retry loop.
              },
            );
          }
        },
      );

      socket.connect();

      return {
        socket,
        session,
        getPresence: () =>
          latestPresence,
      };
    },
  );
}

export function getPartnerChatConnection(
  role:
    PartnerChatRole,

  language:
    Language,
) {
  const existing =
    connections.get(
      role,
    );

  if (
    existing
  ) {
    return existing;
  }

  const connection =
    createConnection(
      role,
      language,
    ).catch(
      (
        error,
      ) => {
        connections.delete(
          role,
        );

        throw error;
      },
    );

  connections.set(
    role,
    connection,
  );

  return connection;
}

export function disconnectPartnerChat(
  role:
    PartnerChatRole,
) {
  const existing =
    connections.get(
      role,
    );

  connections.delete(
    role,
  );

  if (
    existing
  ) {
    void existing.then(
      (
        connection,
      ) => {
        connection.socket.emit(
          "chat:typing:stop",
        );

        connection.socket.disconnect();
      },
    );
  }
}
