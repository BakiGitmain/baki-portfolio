import styles from "./partner-chat.module.css";

import type {
  PartnerChatParticipant,
} from "@/lib/partner-chat-api";

import ChatAvatar from "./chat-avatar";

export default function TypingIndicator({
  language,
  participants,
}: {
  language:
    | "en"
    | "am";

  participants:
    PartnerChatParticipant[];
}) {
  if (
    participants.length ===
    0
  ) {
    return (
      <div
        className={styles.typingPlaceholder}
        aria-hidden="true"
      />
    );
  }

  const message =
    language ===
    "am"
      ? participants.length ===
        1
        ? `${participants[0].name} እየጻፉ ነው`
        : participants.length ===
            2
          ? `${participants[0].name} እና ${participants[1].name} እየጻፉ ነው`
          : `${participants.length} ሰዎች እየጻፉ ነው`
      : participants.length ===
          1
        ? `${participants[0].name} is typing`
        : participants.length ===
            2
          ? `${participants[0].name} and ${participants[1].name} are typing`
          : `${participants.length} people are typing`;

  return (
    <div
      className={styles.typingIndicator}
      aria-live="polite"
    >
      <span className={styles.typingAvatarStack}>
        {participants
          .slice(
            0,
            3,
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

        {participants.length >
          3 && (
          <span className={styles.typingMore}>
            +{participants.length - 3}
          </span>
        )}
      </span>

      <span className={styles.typingText}>{message}</span>

      <span className={styles.typingDots} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}
