export const ADMIN_REPORTS_CHANGED_EVENT =
  "baki-admin-reports-changed";

type Language =
  | "en"
  | "am";

export type AdminReportReply = {
  id:
    string;

  message:
    string;

  adminUserId:
    string | null;

  representativeReadAt:
    string | null;

  createdAt:
    string;

  updatedAt:
    string;
};

export type AdminRepresentativeReport = {
  id:
    string;

  representative: {
    id:
      string;

    name:
      string;

    partnerId:
      string;
  };

  message:
    string;

  adminReadAt:
    string | null;

  createdAt:
    string;

  updatedAt:
    string;

  replied:
    boolean;

  replies:
    AdminReportReply[];

  latestReply:
    AdminReportReply | null;
};

export type AdminReportsResult = {
  reports:
    AdminRepresentativeReport[];

  unreadCount:
    number;
};

function getApiUrl() {
  const apiUrl =
    process.env
      .NEXT_PUBLIC_API_URL;

  if (
    !apiUrl
  ) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured.",
    );
  }

  return apiUrl.replace(
    /\/$/,
    "",
  );
}

async function getApiError(
  response:
    Response,

  language:
    Language,
) {
  try {
    const body =
      await response.json();

    if (
      typeof body?.message ===
      "string"
    ) {
      return body.message;
    }

    if (
      typeof body
        ?.message?.[
          language
        ] ===
      "string"
    ) {
      return body.message[
        language
      ] as string;
    }

    if (
      typeof body
        ?.message?.en ===
      "string"
    ) {
      return body.message.en;
    }
  } catch {
    // Ignore invalid error bodies.
  }

  return language ===
    "am"
    ? "አንድ ችግር ተፈጥሯል።"
    : "Something went wrong.";
}

async function request<T>(
  path:
    string,

  language:
    Language,

  init?:
    RequestInit,
) {
  const response =
    await fetch(
      `${getApiUrl()}${path}`,
      {
        ...init,

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",

          ...(
            init?.headers ??
            {}
          ),
        },
      },
    );

  if (
    !response.ok
  ) {
    throw new Error(
      await getApiError(
        response,
        language,
      ),
    );
  }

  return response.json() as
    Promise<T>;
}

export async function getAdminReports(
  language:
    Language,
) {
  const result =
    await request<{
      success:
        true;

      reports:
        AdminRepresentativeReport[];

      unreadCount:
        number;
    }>(
      "/api/admin/reports",
      language,
    );

  return {
    reports:
      result.reports,

    unreadCount:
      result.unreadCount,
  } satisfies AdminReportsResult;
}

export async function getAdminUnreadReportCount(
  language:
    Language,
) {
  const result =
    await request<{
      success:
        true;

      unreadCount:
        number;
    }>(
      "/api/admin/reports/unread-count",
      language,
    );

  return result.unreadCount;
}

export async function markAdminReportRead(
  reportId:
    string,

  language:
    Language,
) {
  const result =
    await request<{
      success:
        true;

      report:
        AdminRepresentativeReport;
    }>(
      `/api/admin/reports/${encodeURIComponent(
        reportId,
      )}/read`,
      language,
      {
        method:
          "POST",
      },
    );

  return result.report;
}

export async function replyToAdminReport(
  reportId:
    string,

  message:
    string,

  language:
    Language,
) {
  const result =
    await request<{
      success:
        true;

      report:
        AdminRepresentativeReport;
    }>(
      `/api/admin/reports/${encodeURIComponent(
        reportId,
      )}/replies`,
      language,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            message,
          }),
      },
    );

  return result.report;
}
