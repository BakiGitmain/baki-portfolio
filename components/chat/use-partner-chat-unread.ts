"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getPartnerChatUnreadCount,
  type PartnerChatRole,
} from "@/lib/partner-chat-api";

import {
  getPartnerChatConnection,
} from "@/lib/partner-chat-socket";

export const PARTNER_CHAT_UNREAD_EVENT =
  "baki-partner-chat-unread";

export function announcePartnerChatUnread(
  unreadCount:
    number,
) {
  window.dispatchEvent(
    new CustomEvent(
      PARTNER_CHAT_UNREAD_EVENT,
      {
        detail: {
          unreadCount,
        },
      },
    ),
  );
}

export function usePartnerChatUnread({
  role,
  language,
  enabled,
}: {
  role:
    PartnerChatRole;

  language:
    "en" |
    "am";

  enabled:
    boolean;
}) {
  const [
    unreadCount,
    setUnreadCount,
  ] =
    useState(
      0,
    );

  useEffect(
    () => {
      if (
        !enabled
      ) {
        return;
      }

      let cancelled =
        false;

      let refreshTimer:
        ReturnType<
          typeof setTimeout
        > |
        null =
        null;

      async function refresh() {
        try {
          const count =
            await getPartnerChatUnreadCount(
              role,
              language,
            );

          if (
            !cancelled
          ) {
            setUnreadCount(
              count,
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Unable to refresh Partner Chat unread count:",
            error instanceof
              Error
              ? error.message
              : "Unknown unread count error.",
          );
        }
      }

      function scheduleRefresh() {
        if (
          refreshTimer
        ) {
          clearTimeout(
            refreshTimer,
          );
        }

        refreshTimer =
          setTimeout(
            () => {
              refreshTimer =
                null;

              void refresh();
            },
            120,
          );
      }

      function handleLocalUnread(
        event:
          Event,
      ) {
        const detail =
          (
            event as CustomEvent<{
              unreadCount?:
                number;
            }>
          ).detail;

        if (
          typeof detail
            ?.unreadCount ===
          "number"
        ) {
          setUnreadCount(
            Math.max(
              0,
              detail.unreadCount,
            ),
          );
        } else {
          scheduleRefresh();
        }
      }

      window.addEventListener(
        PARTNER_CHAT_UNREAD_EVENT,
        handleLocalUnread,
      );

      const initialTimer =
        setTimeout(
          () => {
            void refresh();
          },
          0,
        );

      let cleanupSocket:
        (() => void) |
        null =
        null;

      void getPartnerChatConnection(
        role,
        language,
      )
        .then(
          (
            connection,
          ) => {
            if (
              cancelled
            ) {
              return;
            }

            const {
              socket,
            } =
              connection;

            const handleUnread =
              (
                payload: {
                  unreadCount:
                    number | null;
                },
              ) => {
                if (
                  typeof payload
                    .unreadCount ===
                  "number"
                ) {
                  setUnreadCount(
                    payload.unreadCount,
                  );
                } else {
                  scheduleRefresh();
                }
              };

            socket.on(
              "connect",
              scheduleRefresh,
            );

            socket.on(
              "chat:unread:update",
              handleUnread,
            );

            cleanupSocket =
              () => {
                socket.off(
                  "connect",
                  scheduleRefresh,
                );

                socket.off(
                  "chat:unread:update",
                  handleUnread,
                );
              };
          },
        )
        .catch(
          (
            error,
          ) => {
            console.error(
              "Unable to connect Partner Chat notifications:",
              error instanceof
                Error
                ? error.message
                : "Unknown socket error.",
            );
          },
        );

      return () => {
        cancelled =
          true;

        clearTimeout(
          initialTimer,
        );

        if (
          refreshTimer
        ) {
          clearTimeout(
            refreshTimer,
          );
        }

        cleanupSocket?.();

        window.removeEventListener(
          PARTNER_CHAT_UNREAD_EVENT,
          handleLocalUnread,
        );
      };
    },
    [
      enabled,
      language,
      role,
    ],
  );

  return unreadCount;
}
