const partnerChatPerformanceEnabled =
  process.env.NODE_ENV ===
    "development" ||
  process.env
    .NEXT_PUBLIC_CHAT_PERF_DIAGNOSTICS ===
    "true";

export function partnerChatPerformanceNow() {
  return typeof performance !==
    "undefined"
    ? performance.now()
    : Date.now();
}

export function logPartnerChatPerformance(
  operation:
    string,
  details:
    Record<
      string,
      number |
      string |
      boolean |
      null
    >,
) {
  if (
    !partnerChatPerformanceEnabled
  ) {
    return;
  }

  console.info(
    `[chat-perf] ${operation} ${JSON.stringify(
      details,
    )}`,
  );
}
