import {
  ArrowDown,
  Loader2,
  MessageCircle,
} from "lucide-react";

import {
  Fragment,
  type RefObject,
} from "react";

import styles from "./partner-chat.module.css";

import type {
  PartnerChatMessage,
  PartnerChatRole,
} from "@/lib/partner-chat-api";

import ChatMessage from "./chat-message";

function dateKey(
  value: string,
) {
  const date =
    new Date(
      value,
    );

  return Number.isNaN(
    date.getTime(),
  )
    ? value
    : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dateLabel(
  value: string,
  language: "en" | "am",
) {
  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  const today =
    new Date();

  const yesterday =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() -
        1,
    );

  if (
    dateKey(
      date.toISOString(),
    ) ===
    dateKey(
      today.toISOString(),
    )
  ) {
    return language ===
      "am"
      ? "ዛሬ"
      : "Today";
  }

  if (
    dateKey(
      date.toISOString(),
    ) ===
    dateKey(
      yesterday.toISOString(),
    )
  ) {
    return language ===
      "am"
      ? "ትናንት"
      : "Yesterday";
  }

  return new Intl.DateTimeFormat(
    language ===
      "am"
      ? "am-ET"
      : "en-US",
    {
      weekday:
        "short",
      month:
        "short",
      day:
        "numeric",
    },
  ).format(
    date,
  );
}

function groupedWithPrevious(
  current: PartnerChatMessage,
  previous: PartnerChatMessage | undefined,
) {
  if (
    !previous ||
    previous.sender
      .participantKey !==
      current.sender
        .participantKey ||
    dateKey(
      previous.createdAt,
    ) !==
      dateKey(
        current.createdAt,
      )
  ) {
    return false;
  }

  return (
    new Date(
      current.createdAt,
    ).getTime() -
      new Date(
        previous.createdAt,
      ).getTime() <
    5 *
      60 *
      1000
  );
}

export default function ChatMessageList({
  language,
  messages,
  selfKey,
  viewerRole,
  loading,
  loadingOlder,
  hasMore,
  newMessageCount,
  highlightedId,
  scrollRef,
  onScroll,
  onLoadOlder,
  onJumpToLatest,
  onReply,
  onEdit,
  onDelete,
  onOpenReply,
}: {
  language:
    | "en"
    | "am";

  messages:
    PartnerChatMessage[];

  selfKey:
    string;

  viewerRole:
    PartnerChatRole;

  loading:
    boolean;

  loadingOlder:
    boolean;

  hasMore:
    boolean;

  newMessageCount:
    number;

  highlightedId:
    string | null;

  scrollRef:
    RefObject<HTMLDivElement | null>;

  onScroll: () => void;

  onLoadOlder: () => void;

  onJumpToLatest: () => void;

  onReply: (
    message: PartnerChatMessage,
  ) => void;

  onEdit: (
    message: PartnerChatMessage,
  ) => void;

  onDelete: (
    message: PartnerChatMessage,
  ) => void;

  onOpenReply: (
    messageId: string,
  ) => void;
}) {
  const copy =
    language ===
    "am"
      ? {
          emptyTitle:
            "ውይይቱን ይጀምሩ",
          emptyBody:
            "ለBaki Digital አጋሮች መልዕክት ይጻፉ። ውይይቱ እዚህ ይታያል።",
          older:
            "የቆዩ መልዕክቶችን ጫን",
          loading:
            "በመጫን ላይ…",
          newMessages: (
            count: number,
          ) =>
            `${count} አዲስ መልዕክት${count === 1 ? "" : "ቶች"}`,
        }
      : {
          emptyTitle:
            "Start the conversation",
          emptyBody:
            "Write a message to the Baki Digital partner group. The conversation will appear here.",
          older:
            "Load older messages",
          loading:
            "Loading…",
          newMessages: (
            count: number,
          ) =>
            `${count} new message${count === 1 ? "" : "s"}`,
        };

  return (
    <div className={styles.messageViewportWrap}>
      <div
        ref={scrollRef}
        className={styles.messageViewport}
        onScroll={onScroll}
      >
        {loading ? (
          <div className={styles.loadingState}>
            <Loader2
              size={22}
              className={styles.spinner}
              aria-hidden="true"
            />
            <span>{copy.loading}</span>
          </div>
        ) : messages.length ===
          0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>
              <MessageCircle
                size={26}
                aria-hidden="true"
              />
            </span>
            <strong>{copy.emptyTitle}</strong>
            <p>{copy.emptyBody}</p>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className={styles.loadOlderWrap}>
                <button
                  type="button"
                  className={styles.loadOlderButton}
                  onClick={onLoadOlder}
                  disabled={loadingOlder}
                >
                  {loadingOlder && (
                    <Loader2
                      size={14}
                      className={styles.spinner}
                      aria-hidden="true"
                    />
                  )}
                  {loadingOlder
                    ? copy.loading
                    : copy.older}
                </button>
              </div>
            )}

            {messages.map(
              (
                message,
                index,
              ) => {
                const previous =
                  messages[
                    index -
                      1
                  ];

                const showDate =
                  !previous ||
                  dateKey(
                    previous.createdAt,
                  ) !==
                    dateKey(
                      message.createdAt,
                    );

                return (
                  <Fragment key={message.id}>
                    {showDate && (
                      <div className={styles.dateSeparator}>
                        <span>
                          {dateLabel(
                            message.createdAt,
                            language,
                          )}
                        </span>
                      </div>
                    )}

                    <ChatMessage
                      message={message}
                      language={language}
                      selfKey={selfKey}
                      viewerRole={viewerRole}
                      grouped={groupedWithPrevious(
                        message,
                        previous,
                      )}
                      highlighted={highlightedId === message.id}
                      onReply={onReply}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onOpenReply={onOpenReply}
                    />
                  </Fragment>
                );
              },
            )}
          </>
        )}
      </div>

      {newMessageCount >
        0 && (
        <button
          type="button"
          className={styles.newMessagesButton}
          onClick={onJumpToLatest}
        >
          <ArrowDown
            size={15}
            aria-hidden="true"
          />
          {copy.newMessages(
            newMessageCount,
          )}
        </button>
      )}
    </div>
  );
}
