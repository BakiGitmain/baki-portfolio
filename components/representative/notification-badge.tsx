export function formatNotificationCount(
  count:
    number,
) {
  return count >
    99
    ? "99+"
    : String(
        Math.max(
          0,
          count,
        ),
      );
}

export default function NotificationBadge({
  count,
  label,
  className =
    "",
}: {
  count:
    number;

  label:
    string;

  className?:
    string;
}) {
  if (
    count <=
    0
  ) {
    return null;
  }

  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-1 text-[9px] font-black leading-none text-white shadow-[0_0_0_4px_rgba(239,68,68,0.1)] ${className}`}
    >
      {formatNotificationCount(
        count,
      )}
    </span>
  );
}
