"use client";

import {
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLanguage,
} from "@/components/providers/language-provider";

import {
  announcePartnerChatUnread,
} from "@/components/chat/use-partner-chat-unread";

import {
  getPartnerChatMessages,
  markPartnerChatRead,
  synchronizePartnerChat,
  type PartnerChatMessage,
  type PartnerChatParticipant,
  type PartnerChatRole,
  type PartnerChatSession,
} from "@/lib/partner-chat-api";

import {
  getPartnerChatConnection,
  type PartnerChatSocket,
  type PartnerChatSocketResult,
} from "@/lib/partner-chat-socket";

import ChatComposer from "./chat-composer";
import ChatHeader from "./chat-header";
import ChatMessageList from "./chat-message-list";
import TypingIndicator from "./typing-indicator";
import styles from "./partner-chat.module.css";

type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline";

type TypingEntry = {
  participant:
    PartnerChatParticipant;

  expiresAt:
    number;
};

function sortAndMergeMessages(
  current: PartnerChatMessage[],
  incoming: PartnerChatMessage[],
) {
  const byId =
    new Map(
      current.map(
        (
          message,
        ) => [
          message.id,
          message,
        ],
      ),
    );

  for (
    const message of incoming
  ) {
    const existing =
      byId.get(
        message.id,
      );

    if (
      !existing ||
      new Date(
        message.updatedAt,
      ).getTime() >=
        new Date(
          existing.updatedAt,
        ).getTime()
    ) {
      byId.set(
        message.id,
        message,
      );
    }
  }

  return Array.from(
    byId.values(),
  ).sort(
    (
      first,
      second,
    ) => {
      const timeDifference =
        new Date(
          first.createdAt,
        ).getTime() -
        new Date(
          second.createdAt,
        ).getTime();

      return timeDifference ||
        first.id.localeCompare(
          second.id,
        );
    },
  );
}

function selectedError(
  result: PartnerChatSocketResult<unknown>,
  language: "en" | "am",
) {
  return result.ok
    ? null
    : result.error.message[
        language
      ] ||
        result.error.message.en;
}

function waitForSocketAck<T>(
  send: (
    resolve: (
      result: PartnerChatSocketResult<T>,
    ) => void,
  ) => void,
  timeoutMessage: string,
) {
  return new Promise<PartnerChatSocketResult<T>>(
    (
      resolve,
      reject,
    ) => {
      const timeout =
        window.setTimeout(
          () => {
            reject(
              new Error(
                timeoutMessage,
              ),
            );
          },
          15_000,
        );

      send(
        (
          result,
        ) => {
          window.clearTimeout(
            timeout,
          );
          resolve(
            result,
          );
        },
      );
    },
  );
}

export default function PartnerChat({
  role,
}: {
  role:
    PartnerChatRole;
}) {
  const {
    language,
  } = useLanguage();

  const [
    session,
    setSession,
  ] =
    useState<PartnerChatSession | null>(
      null,
    );
  const [
    messages,
    setMessages,
  ] =
    useState<PartnerChatMessage[]>(
      [],
    );
  const [
    hasMore,
    setHasMore,
  ] =
    useState(
      false,
    );
  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );
  const [
    loadingOlder,
    setLoadingOlder,
  ] =
    useState(
      false,
    );
  const [
    connectionState,
    setConnectionState,
  ] =
    useState<ConnectionState>(
      "connecting",
    );
  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );
  const [
    participants,
    setParticipants,
  ] =
    useState<PartnerChatParticipant[]>(
      [],
    );
  const [
    onlineCount,
    setOnlineCount,
  ] =
    useState(
      0,
    );
  const [
    typing,
    setTyping,
  ] =
    useState<Map<string, TypingEntry>>(
      new Map(),
    );
  const [
    draft,
    setDraft,
  ] =
    useState(
      "",
    );
  const [
    replyTo,
    setReplyTo,
  ] =
    useState<PartnerChatMessage | null>(
      null,
    );
  const [
    editing,
    setEditing,
  ] =
    useState<PartnerChatMessage | null>(
      null,
    );
  const [
    busy,
    setBusy,
  ] =
    useState(
      false,
    );
  const [
    newMessageCount,
    setNewMessageCount,
  ] =
    useState(
      0,
    );
  const [
    highlightedId,
    setHighlightedId,
  ] =
    useState<string | null>(
      null,
    );
  const [
    reloadKey,
    setReloadKey,
  ] =
    useState(
      0,
    );

  const scrollRef =
    useRef<HTMLDivElement>(
      null,
    );
  const socketRef =
    useRef<PartnerChatSocket | null>(
      null,
    );
  const nearBottomRef =
    useRef(
      true,
    );
  const serverTimeRef =
    useRef<string | null>(
      null,
    );
  const messagesRef =
    useRef<PartnerChatMessage[]>(
      [],
    );
  const cursorRef =
    useRef<string | null>(
      null,
    );
  const hasMoreRef =
    useRef(
      false,
    );
  const readRequestAtRef =
    useRef(
      0,
    );
  const typingStopTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );
  const typingActiveRef =
    useRef(
      false,
    );
  const lastTypingStartRef =
    useRef(
      0,
    );
  const pendingSendRef =
    useRef<{
      id: string;
      message: string;
      replyId: string | null;
    } | null>(
      null,
    );

  const copy =
    language ===
    "am"
      ? {
          loadError:
            "Partner Chatን መጫን አልተቻለም።",
          reconnectError:
            "መልዕክቶችን እንደገና ማመሳሰል አልተቻለም።",
          retry:
            "እንደገና ሞክር",
          deleteConfirm:
            "ይህን መልዕክት መሰረዝ ይፈልጋሉ?",
          editMissing:
            "ይህ መልዕክት ከእንግዲህ ሊስተካከል አይችልም።",
          originalMissing:
            "ዋናው መልዕክት በ7 ቀናት ታሪክ ውስጥ አልተገኘም።",
          sendFailed:
            "መልዕክቱን መላክ አልተቻለም። እንደገና ይሞክሩ።",
          editFailed:
            "መልዕክቱን ማስተካከል አልተቻለም።",
          deleteFailed:
            "መልዕክቱን መሰረዝ አልተቻለም።",
          historyFailed:
            "የቆዩ መልዕክቶችን መጫን አልተቻለም።",
        }
      : {
          loadError:
            "Unable to load Partner Chat.",
          reconnectError:
            "Unable to synchronize messages after reconnecting.",
          retry:
            "Try again",
          deleteConfirm:
            "Delete this message?",
          editMissing:
            "This message can no longer be edited.",
          originalMissing:
            "The original message is no longer in the 7-day history.",
          sendFailed:
            "The message could not be sent. Please try again.",
          editFailed:
            "The message could not be edited.",
          deleteFailed:
            "The message could not be deleted.",
          historyFailed:
            "Unable to load older messages.",
        };

  const mergeIntoState =
    useCallback(
      (
        incoming: PartnerChatMessage[],
      ) => {
        setMessages(
          (
            current,
          ) => {
            const next =
              sortAndMergeMessages(
                current,
                incoming,
              );

            messagesRef.current =
              next;

            return next;
          },
        );
      },
      [],
    );

  const stopLocalTyping =
    useCallback(
      () => {
        if (
          typingStopTimerRef.current
        ) {
          clearTimeout(
            typingStopTimerRef.current,
          );
          typingStopTimerRef.current =
            null;
        }

        if (
          typingActiveRef.current
        ) {
          socketRef.current?.emit(
            "chat:typing:stop",
          );
          typingActiveRef.current =
            false;
        }
      },
      [],
    );

  const markRead =
    useCallback(
      () => {
        const now =
          Date.now();

        if (
          now -
            readRequestAtRef.current <
          1_000
        ) {
          return;
        }

        readRequestAtRef.current =
          now;
        announcePartnerChatUnread(
          0,
        );

        const socket =
          socketRef.current;

        if (
          socket?.connected
        ) {
          socket.emit(
            "chat:read",
          );
          return;
        }

        void markPartnerChatRead(
          role,
          language,
        ).catch(
          () => {
            // The next socket connection or unread refresh retries this cursor.
          },
        );
      },
      [
        language,
        role,
      ],
    );

  const scrollToLatest =
    useCallback(
      (
        behavior: ScrollBehavior =
          "smooth",
      ) => {
        const element =
          scrollRef.current;

        if (
          !element
        ) {
          return;
        }

        element.scrollTo({
          top:
            element.scrollHeight,
          behavior,
        });
        nearBottomRef.current =
          true;
        setNewMessageCount(
          0,
        );
        markRead();
      },
      [
        markRead,
      ],
    );

  const synchronize =
    useCallback(
      async () => {
        const since =
          serverTimeRef.current;

        if (
          !since
        ) {
          return;
        }

        try {
          const result =
            await synchronizePartnerChat(
              role,
              language,
              since,
            );

          if (
            result.truncated
          ) {
            const latest =
              await getPartnerChatMessages(
                role,
                language,
              );
            messagesRef.current =
              latest.messages;
            setMessages(
              latest.messages,
            );
            cursorRef.current =
              latest.nextCursor;
            hasMoreRef.current =
              latest.hasMore;
            setHasMore(
              latest.hasMore,
            );
            serverTimeRef.current =
              latest.serverTime;
          } else {
            mergeIntoState(
              result.messages,
            );
            serverTimeRef.current =
              result.serverTime;
          }

          setError(
            null,
          );
        } catch {
          setError(
            copy.reconnectError,
          );
        }
      },
      [
        copy.reconnectError,
        language,
        mergeIntoState,
        role,
      ],
    );

  useEffect(
    () => {
      let cancelled =
        false;
      let cleanupSocket:
        (() => void) |
        null =
        null;

      void Promise.all([
        getPartnerChatConnection(
          role,
          language,
        ),
        getPartnerChatMessages(
          role,
          language,
        ),
      ])
        .then(
          ([
            connection,
            history,
          ]) => {
            if (
              cancelled
            ) {
              return;
            }

            const {
              socket,
            } = connection;

            socketRef.current =
              socket;
            setSession(
              connection.session,
            );
            const latestPresence =
              connection.getPresence();
            setParticipants(
              latestPresence.participants,
            );
            setOnlineCount(
              latestPresence.onlineCount,
            );
            messagesRef.current =
              history.messages;
            setMessages(
              history.messages,
            );
            cursorRef.current =
              history.nextCursor;
            hasMoreRef.current =
              history.hasMore;
            setHasMore(
              history.hasMore,
            );
            serverTimeRef.current =
              history.serverTime;
            setConnectionState(
              socket.connected
                ? "connected"
                : "connecting",
            );
            setLoading(
              false,
            );

            const handleConnect =
              () => {
                setConnectionState(
                  "connected",
                );
                void synchronize();
              };

            const handleDisconnect =
              () => {
                setConnectionState(
                  "reconnecting",
                );
                setTyping(
                  new Map(),
                );
              };

            const handleConnectError =
              () => {
                setConnectionState(
                  socket.active
                    ? "reconnecting"
                    : "offline",
                );
              };

            const handleReconnectAttempt =
              () => {
                setConnectionState(
                  "reconnecting",
                );
              };

            const handleNewMessage =
              (
                message: PartnerChatMessage,
              ) => {
                mergeIntoState([
                  message,
                ]);

                const isOwn =
                  message.sender
                    .participantKey ===
                  connection.session
                    .self
                    .participantKey;

                if (
                  nearBottomRef.current ||
                  isOwn
                ) {
                  window.setTimeout(
                    () => {
                      scrollToLatest(
                        isOwn
                          ? "smooth"
                          : "auto",
                      );
                    },
                    0,
                  );
                } else {
                  setNewMessageCount(
                    (
                      count,
                    ) =>
                      count +
                      1,
                  );
                }
              };

            const handleChangedMessage =
              (
                message: PartnerChatMessage,
              ) => {
                mergeIntoState([
                  message,
                ]);
              };

            const handleTypingStart =
              (
                payload: {
                  typingSessionId: string;
                  participant: PartnerChatParticipant;
                },
              ) => {
                if (
                  payload.participant
                    .participantKey ===
                  connection.session
                    .self
                    .participantKey
                ) {
                  return;
                }

                setTyping(
                  (
                    current,
                  ) => {
                    const next =
                      new Map(
                        current,
                      );
                    next.set(
                      payload.typingSessionId,
                      {
                        participant:
                          payload.participant,
                        expiresAt:
                          Date.now() +
                          7_000,
                      },
                    );
                    return next;
                  },
                );
              };

            const handleTypingStop =
              (
                payload: {
                  typingSessionId: string;
                },
              ) => {
                setTyping(
                  (
                    current,
                  ) => {
                    const next =
                      new Map(
                        current,
                      );
                    next.delete(
                      payload.typingSessionId,
                    );
                    return next;
                  },
                );
              };

            const handlePresence =
              (
                payload: {
                  onlineCount: number;
                  participants: PartnerChatParticipant[];
                },
              ) => {
                setOnlineCount(
                  payload.onlineCount,
                );
                setParticipants(
                  payload.participants,
                );
              };

            socket.on(
              "connect",
              handleConnect,
            );
            socket.on(
              "disconnect",
              handleDisconnect,
            );
            socket.on(
              "connect_error",
              handleConnectError,
            );
            socket.io.on(
              "reconnect_attempt",
              handleReconnectAttempt,
            );
            socket.on(
              "chat:message:new",
              handleNewMessage,
            );
            socket.on(
              "chat:message:edit",
              handleChangedMessage,
            );
            socket.on(
              "chat:message:delete",
              handleChangedMessage,
            );
            socket.on(
              "chat:typing:start",
              handleTypingStart,
            );
            socket.on(
              "chat:typing:stop",
              handleTypingStop,
            );
            socket.on(
              "chat:presence:update",
              handlePresence,
            );

            cleanupSocket =
              () => {
                socket.off(
                  "connect",
                  handleConnect,
                );
                socket.off(
                  "disconnect",
                  handleDisconnect,
                );
                socket.off(
                  "connect_error",
                  handleConnectError,
                );
                socket.io.off(
                  "reconnect_attempt",
                  handleReconnectAttempt,
                );
                socket.off(
                  "chat:message:new",
                  handleNewMessage,
                );
                socket.off(
                  "chat:message:edit",
                  handleChangedMessage,
                );
                socket.off(
                  "chat:message:delete",
                  handleChangedMessage,
                );
                socket.off(
                  "chat:typing:start",
                  handleTypingStart,
                );
                socket.off(
                  "chat:typing:stop",
                  handleTypingStop,
                );
                socket.off(
                  "chat:presence:update",
                  handlePresence,
                );
              };

            window.setTimeout(
              () => {
                if (
                  !cancelled
                ) {
                  scrollToLatest(
                    "auto",
                  );
                }
              },
              0,
            );
          },
        )
        .catch(
          (
            requestError,
          ) => {
            if (
              cancelled
            ) {
              return;
            }

            setLoading(
              false,
            );
            setConnectionState(
              "offline",
            );
            setError(
              requestError instanceof
                Error
                ? requestError.message
                : copy.loadError,
            );
          },
        );

      return () => {
        cancelled =
          true;
        cleanupSocket?.();
        stopLocalTyping();
        socketRef.current =
          null;
      };
    },
    [
      copy.loadError,
      language,
      mergeIntoState,
      reloadKey,
      role,
      scrollToLatest,
      stopLocalTyping,
      synchronize,
    ],
  );

  useEffect(
    () => {
      const timer =
        window.setInterval(
          () => {
            const now =
              Date.now();

            setTyping(
              (
                current,
              ) => {
                const next =
                  new Map(
                    Array.from(
                      current.entries(),
                    ).filter(
                      ([
                        ,
                        entry,
                      ]) =>
                        entry.expiresAt >
                        now,
                    ),
                  );

                return next.size ===
                  current.size
                  ? current
                  : next;
              },
            );
          },
          1_000,
        );

      return () => {
        window.clearInterval(
          timer,
        );
      };
    },
    [],
  );

  const typingParticipants =
    useMemo(
      () => {
        const unique =
          new Map<string, PartnerChatParticipant>();

        for (
          const entry of typing.values()
        ) {
          unique.set(
            entry.participant
              .participantKey,
            entry.participant,
          );
        }

        return Array.from(
          unique.values(),
        );
      },
      [
        typing,
      ],
    );

  function handleScroll() {
    const element =
      scrollRef.current;

    if (
      !element
    ) {
      return;
    }

    const nearBottom =
      element.scrollHeight -
        element.scrollTop -
        element.clientHeight <
      110;

    nearBottomRef.current =
      nearBottom;

    if (
      nearBottom
    ) {
      setNewMessageCount(
        0,
      );
      markRead();
    }
  }

  async function loadOlder() {
    if (
      loadingOlder ||
      !cursorRef.current
    ) {
      return;
    }

    const element =
      scrollRef.current;
    const previousHeight =
      element?.scrollHeight ??
      0;
    const before =
      cursorRef.current;

    setLoadingOlder(
      true,
    );

    try {
      const result =
        await getPartnerChatMessages(
          role,
          language,
          {
            before,
          },
        );
      mergeIntoState(
        result.messages,
      );
      cursorRef.current =
        result.nextCursor;
      hasMoreRef.current =
        result.hasMore;
      setHasMore(
        result.hasMore,
      );
      window.requestAnimationFrame(
        () => {
          window.requestAnimationFrame(
            () => {
              if (
                element
              ) {
                element.scrollTop +=
                  element.scrollHeight -
                  previousHeight;
              }
            },
          );
        },
      );
    } catch {
      setError(
        copy.historyFailed,
      );
    } finally {
      setLoadingOlder(
        false,
      );
    }
  }

  async function openReply(
    messageId: string,
  ) {
    let available =
      messagesRef.current.some(
        (
          message,
        ) =>
          message.id ===
          messageId,
      );
    let before =
      cursorRef.current;
    let attempts =
      0;

    while (
      !available &&
      before &&
      attempts <
        10
    ) {
      attempts +=
        1;

      try {
        const result =
          await getPartnerChatMessages(
            role,
            language,
            {
              before,
              limit:
                50,
            },
          );
        const nextMessages =
          sortAndMergeMessages(
            messagesRef.current,
            result.messages,
          );
        messagesRef.current =
          nextMessages;
        setMessages(
          nextMessages,
        );
        before =
          result.nextCursor;
        cursorRef.current =
          before;
        hasMoreRef.current =
          result.hasMore;
        setHasMore(
          result.hasMore,
        );
        available =
          nextMessages.some(
            (
              message,
            ) =>
              message.id ===
              messageId,
          );
      } catch {
        break;
      }
    }

    if (
      !available
    ) {
      setError(
        copy.originalMissing,
      );
      return;
    }

    setHighlightedId(
      messageId,
    );
    window.setTimeout(
      () => {
        document
          .getElementById(
            `partner-chat-message-${messageId}`,
          )
          ?.scrollIntoView({
            behavior:
              "smooth",
            block:
              "center",
          });
      },
      0,
    );
    window.setTimeout(
      () => {
        setHighlightedId(
          null,
        );
      },
      2_000,
    );
  }

  function handleDraftChange(
    value: string,
  ) {
    setDraft(
      value,
    );
    setError(
      null,
    );
    pendingSendRef.current =
      null;

    const socket =
      socketRef.current;

    if (
      !socket?.connected ||
      value.trim().length ===
        0
    ) {
      stopLocalTyping();
      return;
    }

    const now =
      Date.now();

    if (
      !typingActiveRef.current ||
      now -
        lastTypingStartRef.current >=
        4_000
    ) {
      socket.emit(
        "chat:typing:start",
        {},
      );
      typingActiveRef.current =
        true;
      lastTypingStartRef.current =
        now;
    }

    if (
      typingStopTimerRef.current
    ) {
      clearTimeout(
        typingStopTimerRef.current,
      );
    }

    typingStopTimerRef.current =
      setTimeout(
        stopLocalTyping,
        2_500,
      );
  }

  function beginReply(
    message: PartnerChatMessage,
  ) {
    setEditing(
      null,
    );
    setReplyTo(
      message,
    );
    setDraft(
      "",
    );
    pendingSendRef.current =
      null;
  }

  function beginEdit(
    message: PartnerChatMessage,
  ) {
    if (
      message.deletedAt ||
      !message.message
    ) {
      setError(
        copy.editMissing,
      );
      return;
    }

    setReplyTo(
      null,
    );
    setEditing(
      message,
    );
    setDraft(
      message.message,
    );
    pendingSendRef.current =
      null;
  }

  function cancelContext() {
    setReplyTo(
      null,
    );
    setEditing(
      null,
    );
    setDraft(
      "",
    );
    pendingSendRef.current =
      null;
    stopLocalTyping();
  }

  async function submitMessage() {
    const socket =
      socketRef.current;
    const text =
      draft.trim();

    if (
      !socket?.connected ||
      busy ||
      !text
    ) {
      return;
    }

    setBusy(
      true,
    );
    setError(
      null,
    );
    stopLocalTyping();

    try {
      if (
        editing
      ) {
        const result =
          await waitForSocketAck<PartnerChatMessage>(
            (
              resolve,
            ) => {
              socket.emit(
                "chat:message:edit",
                {
                  messageId:
                    editing.id,
                  message:
                    text,
                },
                resolve,
              );
            },
            copy.editFailed,
          );

        if (
          !result.ok
        ) {
          throw new Error(
            selectedError(
              result,
              language,
            ) ??
              copy.editFailed,
          );
        }

        mergeIntoState([
          result.data,
        ]);
        setEditing(
          null,
        );
      } else {
        const replyId =
          replyTo?.id ??
          null;
        const pending =
          pendingSendRef.current;
        const clientMessageId =
          pending &&
          pending.message ===
            text &&
          pending.replyId ===
            replyId
            ? pending.id
            : crypto.randomUUID();

        pendingSendRef.current = {
          id:
            clientMessageId,
          message:
            text,
          replyId,
        };

        const result =
          await waitForSocketAck<PartnerChatMessage>(
            (
              resolve,
            ) => {
              socket.emit(
                "chat:message:send",
                {
                  clientMessageId,
                  message:
                    text,
                  replyToMessageId:
                    replyId,
                },
                resolve,
              );
            },
            copy.sendFailed,
          );

        if (
          !result.ok
        ) {
          throw new Error(
            selectedError(
              result,
              language,
            ) ??
              copy.sendFailed,
          );
        }

        pendingSendRef.current =
          null;
        mergeIntoState([
          result.data,
        ]);
        setReplyTo(
          null,
        );
      }

      setDraft(
        "",
      );
      window.setTimeout(
        () => {
          scrollToLatest();
        },
        0,
      );
    } catch (
      submitError
    ) {
      setError(
        submitError instanceof
          Error
          ? submitError.message
          : editing
            ? copy.editFailed
            : copy.sendFailed,
      );
    } finally {
      setBusy(
        false,
      );
    }
  }

  async function deleteMessage(
    message: PartnerChatMessage,
  ) {
    const socket =
      socketRef.current;

    if (
      !socket?.connected ||
      !window.confirm(
        copy.deleteConfirm,
      )
    ) {
      return;
    }

    setError(
      null,
    );

    let result:
      PartnerChatSocketResult<PartnerChatMessage>;

    try {
      result =
        await waitForSocketAck<PartnerChatMessage>(
          (
            resolve,
          ) => {
            socket.emit(
              "chat:message:delete",
              {
                messageId:
                  message.id,
              },
              resolve,
            );
          },
          copy.deleteFailed,
        );
    } catch {
      setError(
        copy.deleteFailed,
      );
      return;
    }

    if (
      !result.ok
    ) {
      setError(
        selectedError(
          result,
          language,
        ) ??
          copy.deleteFailed,
      );
      return;
    }

    mergeIntoState([
      result.data,
    ]);

    if (
      editing?.id ===
        message.id ||
      replyTo?.id ===
        message.id
    ) {
      cancelContext();
    }
  }

  return (
    <section className={styles.chatShell}>
      <ChatHeader
        language={language}
        onlineCount={onlineCount}
        participants={participants}
        connectionState={connectionState}
      />

      {error && (
        <div
          className={styles.errorBanner}
          role="alert"
        >
          <AlertCircle
            size={16}
            aria-hidden="true"
          />
          <span>{error}</span>

          {!session && (
            <button
              type="button"
              onClick={() => {
                setLoading(
                  true,
                );
                setError(
                  null,
                );
                setConnectionState(
                  "connecting",
                );
                setReloadKey(
                  (
                    current,
                  ) =>
                    current +
                    1,
                );
              }}
            >
              <RefreshCw
                size={13}
                aria-hidden="true"
              />
              {copy.retry}
            </button>
          )}
        </div>
      )}

      <ChatMessageList
        language={language}
        messages={messages}
        selfKey={session?.self.participantKey ?? ""}
        viewerRole={role}
        loading={loading}
        loadingOlder={loadingOlder}
        hasMore={hasMore}
        newMessageCount={newMessageCount}
        highlightedId={highlightedId}
        scrollRef={scrollRef}
        onScroll={handleScroll}
        onLoadOlder={() => {
          void loadOlder();
        }}
        onJumpToLatest={() =>
          scrollToLatest()
        }
        onReply={beginReply}
        onEdit={beginEdit}
        onDelete={(
          message,
        ) => {
          void deleteMessage(
            message,
          );
        }}
        onOpenReply={(
          messageId,
        ) => {
          void openReply(
            messageId,
          );
        }}
      />

      <TypingIndicator
        language={language}
        participants={typingParticipants}
      />

      <ChatComposer
        language={language}
        value={draft}
        replyTo={replyTo}
        editing={editing}
        busy={busy}
        connected={connectionState === "connected"}
        onChange={handleDraftChange}
        onSubmit={() => {
          void submitMessage();
        }}
        onCancelContext={cancelContext}
        onBlur={stopLocalTyping}
      />
    </section>
  );
}
