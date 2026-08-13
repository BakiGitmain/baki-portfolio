export function isPartnerBanActiveAt(
  ban: {
    endedAt: Date | string | null;
    isPermanent: boolean;
    bannedUntil: Date | string | null;
  },
  now = new Date(),
) {
  if (ban.endedAt) return false;
  if (ban.isPermanent) return true;
  if (!ban.bannedUntil) return false;
  return new Date(ban.bannedUntil).getTime() > now.getTime();
}

export function canRepresentativeReportMessage(input: {
  reporterRepresentativeId: string;
  senderType: "representative" | "admin";
  senderRepresentativeId: string | null;
}) {
  return !(
    input.senderType === "representative" &&
    input.senderRepresentativeId === input.reporterRepresentativeId
  );
}

export function isPostgresUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export function isProgramOperational(deletedAt: Date | string | null) {
  return deletedAt === null;
}
