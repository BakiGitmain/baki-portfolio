import {
  Pencil,
  Reply,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import styles from "./partner-chat.module.css";

import type {
  PartnerChatMessage,
  PartnerChatRole,
} from "@/lib/partner-chat-api";

import ChatAvatar from "./chat-avatar";

function formatTime(
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
    return "";
  }

  return new Intl.DateTimeFormat(
    language ===
      "am"
      ? "am-ET"
      : "en-US",
    {
      hour:
        "numeric",
      minute:
        "2-digit",
    },
  ).format(
    date,
  );
}

export default function ChatMessage({
  message,
  language,
  selfKey,
  viewerRole,
  grouped,
  highlighted,
  onReply,
  onEdit,
  onDelete,
  onOpenReply,
}: {
  message:
    PartnerChatMessage;

  language:
    | "en"
    | "am";

  selfKey:
    string;

  viewerRole:
    PartnerChatRole;

  grouped:
    boolean;

  highlighted:
    boolean;

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
  const isOwn =
    message.sender
      .participantKey ===
    selfKey;

  const canDelete =
    !message.deletedAt &&
    (
      isOwn ||
      viewerRole ===
        "admin"
    );

  const copy =
    language ===
    "am"
      ? {
          admin:
            "አስተዳዳሪ",
          edited:
            "የተስተካከለ",
          deleted:
            "ይህ መልዕክት ተሰርዟል",
          reply:
            "ምላሽ ይስጡ",
          edit:
            "መልዕክቱን ያስተካክሉ",
          remove:
            "መልዕክቱን ይሰርዙ",
          replyDeleted:
            "የተሰረዘ መልዕክት",
        }
      : {
          admin:
            "Admin",
          edited:
            "edited",
          deleted:
            "This message was deleted",
          reply:
            "Reply",
          edit:
            "Edit message",
          remove:
            "Delete message",
          replyDeleted:
            "Deleted message",
        };

  return (
    <article
      id={`partner-chat-message-${message.id}`}
      className={[
        styles.messageRow,
        grouped
          ? styles.messageRowGrouped
          : "",
        highlighted
          ? styles.messageHighlighted
          : "",
        message.deletedAt
          ? styles.messageDeleted
          : "",
        isOwn
          ? styles.messageOwn
          : "",
      ]
        .filter(
          Boolean,
        )
        .join(
          " ",
        )}
    >
      <div className={styles.messageAvatarCell}>
        {!grouped && (
          <ChatAvatar
            participant={message.sender}
          />
        )}
      </div>

      <div className={styles.messageContent}>
        {!grouped && (
          <div className={styles.messageMeta}>
            <strong>{message.sender.name}</strong>

            {message.sender.role ===
              "admin" && (
              <span className={styles.adminBadge}>
                <ShieldCheck
                  size={11}
                  aria-hidden="true"
                />
                {copy.admin}
              </span>
            )}

            {message.sender.partnerId && (
              <span className={styles.partnerId}>
                {message.sender.partnerId}
              </span>
            )}

            <time dateTime={message.createdAt}>
              {formatTime(
                message.createdAt,
                language,
              )}
            </time>
          </div>
        )}

        {message.replyTo && (
          <button
            type="button"
            className={styles.replyPreview}
            onClick={() =>
              onOpenReply(
                message.replyTo!.id,
              )
            }
          >
            <span className={styles.replyPreviewName}>
              {message.replyTo.sender.name}
            </span>
            <span className={styles.replyPreviewText}>
              {message.replyTo.deleted
                ? copy.replyDeleted
                : message.replyTo.message}
            </span>
          </button>
        )}

        <div className={styles.messageBodyRow}>
          <p className={styles.messageText}>
            {message.deletedAt
              ? copy.deleted
              : message.message}

            {!message.deletedAt &&
              message.editedAt && (
                <span className={styles.editedLabel}>
                  ({copy.edited})
                </span>
              )}
          </p>

          {!message.deletedAt && (
            <div className={styles.messageActions}>
              <button
                type="button"
                onClick={() =>
                  onReply(
                    message,
                  )
                }
                aria-label={copy.reply}
                title={copy.reply}
              >
                <Reply
                  size={15}
                  aria-hidden="true"
                />
              </button>

              {isOwn && (
                <button
                  type="button"
                  onClick={() =>
                    onEdit(
                      message,
                    )
                  }
                  aria-label={copy.edit}
                  title={copy.edit}
                >
                  <Pencil
                    size={14}
                    aria-hidden="true"
                  />
                </button>
              )}

              {canDelete && (
                <button
                  type="button"
                  className={styles.deleteAction}
                  onClick={() =>
                    onDelete(
                      message,
                    )
                  }
                  aria-label={copy.remove}
                  title={copy.remove}
                >
                  <Trash2
                    size={14}
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
