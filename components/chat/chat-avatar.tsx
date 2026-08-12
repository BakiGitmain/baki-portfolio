import styles from "./partner-chat.module.css";

import type {
  PartnerChatParticipant,
} from "@/lib/partner-chat-api";

function getInitials(
  name: string,
) {
  return name
    .trim()
    .split(
      /\s+/,
    )
    .filter(
      Boolean,
    )
    .slice(
      0,
      2,
    )
    .map(
      (
        part,
      ) =>
        part[0]
          ?.toUpperCase(),
    )
    .join(
      "",
    ) ||
    "BD";
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
        // The API currently returns null, but keeping the renderer ready avoids
        // changing the message contract when profile photos are introduced.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={participant.avatarUrl}
          alt=""
          className={styles.avatarImage}
        />
      ) : (
        getInitials(
          participant.name,
        )
      )}
    </span>
  );
}
