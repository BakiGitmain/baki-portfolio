import styles from "./partner-chat.module.css";

import type {
  PartnerChatParticipant,
} from "@/lib/partner-chat-api";

function getInitial(
  name: string,
) {
  return name
    .trim()
    .charAt(
      0,
    )
    .toUpperCase() ||
    "B";
}

export default function ChatAvatar({
  participant,
  size = "medium",
}: {
  participant:
    PartnerChatParticipant;

  size?:
    | "small"
    | "medium";
}) {
  const className = [
    styles.avatar,
    size ===
      "small"
      ? styles.avatarSmall
      : "",
    participant.role ===
      "admin"
      ? styles.avatarAdmin
      : "",
  ]
    .filter(
      Boolean,
    )
    .join(
      " ",
    );

  return (
    <span
      className={className}
      aria-hidden="true"
    >
      {participant.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={participant.avatarUrl}
          alt=""
          className={styles.avatarImage}
        />
      ) : (
        getInitial(
          participant.name,
        )
      )}
    </span>
  );
}
