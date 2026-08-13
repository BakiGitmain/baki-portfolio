export type PartnerBanDuration =
  | "1h"
  | "24h"
  | "1w"
  | "30d"
  | "permanent"
  | "custom";

export type ActivePartnerBan = {
  id: string;
  reason: string;
  startedAt: string;
  bannedUntil: string | null;
  isPermanent: boolean;
};

export type PartnerBanHistoryItem = ActivePartnerBan & {
  endedAt: string | null;
  endReason: "unbanned" | "expired" | null;
  bannedByName: string | null;
  endedByName: string | null;
  sourceChatReportId: string | null;
};

export type PartnerModerationProfile = {
  active: ActivePartnerBan | null;
  history: PartnerBanHistoryItem[];
};

type Language = "en" | "am";

function apiUrl() {
  const value = process.env.NEXT_PUBLIC_API_URL;
  if (!value) throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  return value.replace(/\/$/, "");
}

async function errorMessage(response: Response, language: Language) {
  try {
    const body = await response.json();
    if (typeof body?.message === "string") return body.message;
    return body?.message?.[language] ?? body?.message?.en ?? "Unable to update Partner access.";
  } catch {
    return language === "am" ? "የPartner መዳረሻ ማዘመን አልተቻለም።" : "Unable to update Partner access.";
  }
}

async function request<T>(path: string, language: Language, init?: RequestInit) {
  const response = await fetch(`${apiUrl()}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) throw new Error(await errorMessage(response, language));
  return response.json() as Promise<T>;
}

export async function getPartnerModeration(
  representativeId: string,
  language: Language,
) {
  const result = await request<{ success: true; moderation: PartnerModerationProfile }>(
    `/api/admin/partners/${encodeURIComponent(representativeId)}/moderation`,
    language,
  );
  return result.moderation;
}

export async function banAdminPartner(
  representativeId: string,
  language: Language,
  input: {
    duration: PartnerBanDuration;
    reason: string;
    customUntil?: string | null;
    sourceChatReportId?: string | null;
  },
) {
  return request<{ success: true; active: ActivePartnerBan }>(
    `/api/admin/partners/${encodeURIComponent(representativeId)}/ban`,
    language,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export async function unbanAdminPartner(
  representativeId: string,
  language: Language,
) {
  return request<{ success: true }>(
    `/api/admin/partners/${encodeURIComponent(representativeId)}/unban`,
    language,
    { method: "POST" },
  );
}
