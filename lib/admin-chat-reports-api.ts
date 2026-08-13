import type {
  PartnerChatReportReason,
} from "@/lib/partner-chat-api";

export type AdminChatReportStatus = "pending" | "resolved" | "dismissed";

export type AdminChatReport = {
  id: string;
  messageId: string | null;
  reported: {
    role: "representative" | "admin";
    representativeId: string | null;
    name: string;
    partnerId: string | null;
    avatarUrl: string | null;
    performance: {
      rank: "NOOB" | "PRO" | "EXPERT";
      verifiedSales: number;
      reports: number;
    } | null;
  };
  reporter: {
    id: string;
    name: string;
    partnerId: string;
  };
  evidence: {
    message: string;
    sentAt: string;
    replyContext: string | null;
    reportedNameSnapshot: string;
    reportedPartnerIdSnapshot: string | null;
  };
  reason: PartnerChatReportReason;
  note: string;
  status: AdminChatReportStatus;
  reviewedAt: string | null;
  reviewedByName: string | null;
  resolutionNote: string;
  actionSummary: string;
  createdAt: string;
  updatedAt: string;
};

type Language = "en" | "am";

function apiUrl() {
  const value = process.env.NEXT_PUBLIC_API_URL;
  if (!value) throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  return value.replace(/\/$/, "");
}

async function request<T>(path: string, language: Language, init?: RequestInit) {
  const response = await fetch(`${apiUrl()}/api/admin/chat-reports${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  });

  if (!response.ok) {
    let message = language === "am" ? "የChat reports መጫን አልተቻለም።" : "Unable to load Chat reports.";
    try {
      const body = await response.json();
      message = typeof body?.message === "string"
        ? body.message
        : body?.message?.[language] ?? body?.message?.en ?? message;
    } catch {}
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function getAdminChatReports(status: AdminChatReportStatus, language: Language) {
  const result = await request<{ success: true; reports: AdminChatReport[] }>(
    `?status=${encodeURIComponent(status)}`,
    language,
  );
  return result.reports;
}

export async function getAdminChatReportAttentionCount(language: Language) {
  const result = await request<{ success: true; count: number }>("/attention-count", language);
  return result.count;
}

export async function reviewAdminChatReport(
  reportId: string,
  language: Language,
  input: {
    status: "resolved" | "dismissed";
    resolutionNote?: string;
    actionSummary?: string;
  },
) {
  const result = await request<{ success: true; report: AdminChatReport }>(
    `/${encodeURIComponent(reportId)}`,
    language,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  return result.report;
}
