import {
  LockKeyhole,
  MessageCircleMore,
  UsersRound,
} from "lucide-react";

import styles from "./partner-chat.module.css";

import type {
  PartnerChatParticipant,
} from "@/lib/partner-chat-api";

import ChatAvatar from "./chat-avatar";

export default function ChatHeader({
  language,
  onlineCount,
  participants,
  connectionState,
}: {
  language:
    | "en"
    | "am";

  onlineCount:
    number;

  participants:
    PartnerChatParticipant[];

  connectionState:
    | "connecting"
    | "connected"
    | "reconnecting"
    | "offline";
}) {
  const copy =
    language ===
    "am"
      ? {
          eyebrow:
            "የአጋሮች የጋራ ውይይት",
          title:
            "የBaki Digital አጋሮች",
          online:
            `${onlineCount} በመስመር ላይ`,
          connecting:
            "በመገናኘት ላይ…",
          reconnecting:
            "እንደገና በመገናኘት ላይ…",
          offline:
            "ከመስመር ውጭ",
          retention:
            "መልዕክቶች ለ7 ቀናት ይቀመጣሉ",
        }
      : {
          eyebrow:
            "Partner group conversation",
          title:
            "Baki Digital Partners",
          online:
            `${onlineCount} online`,
          connecting:
            "Connecting…",
          reconnecting:
            "Reconnecting…",
          offline:
            "Offline",
          retention:
            "Messages are kept for 7 days",
        };

  const status =
    connectionState ===
    "connected"
      ? copy.online
      : connectionState ===
          "reconnecting"
        ? copy.reconnecting
        : connectionState ===
            "offline"
          ? copy.offline
          : copy.connecting;

  return (
    <header className={styles.header}>
      <div className={styles.headerIcon}>
        <MessageCircleMore
          size={22}
          aria-hidden="true"
        />
      </div>

      <div className={styles.headerCopy}>
        <p className={styles.eyebrow}>
          {copy.eyebrow}
        </p>

        <h2 className={styles.title}>
          {copy.title}
        </h2>

        <div className={styles.statusRow}>
          <span
            className={[
              styles.statusDot,
              connectionState !==
              "connected"
                ? styles.statusDotMuted
                : "",
            ]
              .filter(
                Boolean,
              )
              .join(
                " ",
              )}
          />

          <span>{status}</span>

          <span
            aria-hidden="true"
            className={styles.statusDivider}
          >
            •
          </span>

          <LockKeyhole
            size={12}
            aria-hidden="true"
          />

          <span>{copy.retention}</span>
        </div>
      </div>

      <div
        className={styles.presenceStack}
        title={participants
          .slice(
            0,
            5,
          )
          .map(
            (
              participant,
            ) =>
              participant.name,
          )
          .join(
            ", ",
          )}
      >
        {participants
          .slice(
            0,
            4,
          )
          .map(
            (
              participant,
            ) => (
              <ChatAvatar
                key={participant.participantKey}
                participant={participant}
                size="small"
              />
            ),
          )}

        {onlineCount >
        4 ? (
          <span className={styles.presenceMore}>
            +{onlineCount - 4}
          </span>
        ) : onlineCount ===
          0 ? (
          <span className={styles.presenceEmpty}>
            <UsersRound
              size={18}
              aria-hidden="true"
            />
          </span>
        ) : null}
      </div>
    </header>
  );
}
