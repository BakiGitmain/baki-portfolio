/* =========================================================
   ADMIN APPLICATIONS API
   ========================================================= */

export type ApplicationStatus =
  | "pending"
  | "reviewing"
  | "accepted"
  | "rejected"
  | "archived";

export type ApplicationFilterStatus =
  | "all"
  | ApplicationStatus;

export type ApplicationDocumentSide =
  | "front"
  | "back";

export type AdminApplication = {
  id:
    string;

  applicationCode:
    string;

  fullName:
    string;

  fatherName:
    string;

  email:
    string;

  phone:
    string;

  city:
    string;

  address:
    string;

  telegram:
    string | null;

  whatsapp:
    string | null;

  motivation:
    string;

  idType:
    string;

  documents: {
    front:
      boolean;

    back:
      boolean;
  };

  status:
    ApplicationStatus;

  adminNotes:
    string;

  rulesAccepted:
    boolean;

  rulesAcceptedAt:
    string;

  reviewedAt:
    string | null;

  reviewedByAdminId:
    string | null;

  createdAt:
    string;

  updatedAt:
    string;

  referredBy:
    | {
        name:
          string;

        partnerId:
          string;
      }
    | null;
};

export type ApplicationsSummary = {
  total:
    number;

  pending:
    number;

  reviewing:
    number;

  accepted:
    number;

  rejected:
    number;

  archived:
    number;
};

export type ApplicationsPagination = {
  page:
    number;

  limit:
    number;

  total:
    number;

  totalPages:
    number;
};

export type AdminApplicationsResult = {
  applications:
    AdminApplication[];

  summary:
    ApplicationsSummary;

  pagination:
    ApplicationsPagination;
};

export type AdminApplicationInsight = {
  representative: {
    id:
      string;

    partnerId:
      string;

    legalName:
      string;

    displayName:
      string;

    effectiveName:
      string;

    email:
      string;

    phone:
      string;

    city:
      string;

    preferredLanguage:
      "en" |
      "am";

    active:
      boolean;

    avatarUrl:
      string |
      null;

    createdAt:
      string;

    lastLoginAt:
      string |
      null;

    lastActivityAt:
      string |
      null;
  } | null;

  summary: {
    reports:
      number;

    unreadReports:
      number;

    lastReportAt:
      string |
      null;

    trainingPercent:
      number;

    completedLessons:
      number;

    totalLessons:
      number;

    programs:
      number;

    activePrograms:
      number;
  } | null;

  performance: {
    verifiedSales:
      number;

    reports:
      number;

    rank:
      "NOOB" |
      "PRO" |
      "EXPERT";

    sales:
      Array<{
        id:
          string;

        reference:
          string |
          null;

        note:
          string;

        status:
          "active" |
          "reversed";

        addedAt:
          string;

        reversedAt:
          string |
          null;

        reversalNote:
          string;

        addedByName:
          string |
          null;

        reversedByName:
          string |
          null;
      }>;
  } | null;

  reports:
    Array<{
      id:
        string;

      message:
        string;

      adminReadAt:
        string |
        null;

      replyCount:
        number;

      latestReplyAt:
        string |
        null;

      replies:
        Array<{
          id:
            string;

          message:
            string;

          representativeReadAt:
            string |
            null;

          createdAt:
            string;
        }>;

      createdAt:
        string;

      updatedAt:
        string;
    }>;

  training:
    Array<{
      id:
        string;

      titleEn:
        string;

      titleAm:
        string;

      status:
        string;

      progress: {
        totalLessons:
          number;

        completedLessons:
          number;

        percent:
          number;
      };

      sections:
        Array<{
          id:
            string;

          titleEn:
            string;

          titleAm:
            string;

          lessons:
            Array<{
              id:
                string;

              titleEn:
                string;

              titleAm:
                string;

              durationSeconds:
                number;

              watchedSeconds:
                number;

              completed:
                boolean;

              completedAt:
                string |
                null;

              updatedAt:
                string |
                null;
            }>;
        }>;
    }>;

  programs:
    Array<{
      id:
        string;

      title:
        string;

      description:
        string;

      effectiveStatus:
        string;

      startDate:
        string;

      endDate:
        string;

      progressPercent:
        number;

      targets:
        Array<{
          id:
            string;

          targetType:
            "reports" |
            "lessons" |
            "course_completion" |
            "leads_submitted" |
            "qualified_lead" |
            "confirmed_sale" |
            "partner_referral" |
            "custom_challenge";

          targetValue:
            number;

          actualValue:
            number;

          courseId:
            string |
            null;

          courseTitleEn:
            string |
            null;

          courseTitleAm:
            string |
            null;
        }>;
    }>;

  activity:
    Array<{
      type:
        string;

      entityId:
        string;

      label:
        string;

      createdAt:
        string;
    }>;

  leads: {
    available:
      false;

    reason:
      string;
  };
};

type Language =
  | "en"
  | "am";

type ApiLocalizedMessage = {
  en?:
    string;

  am?:
    string;
};

type ApplicationsResponse = {
  success:
    boolean;

  applications:
    AdminApplication[];

  summary:
    ApplicationsSummary;

  pagination:
    ApplicationsPagination;
};

type ApplicationResponse = {
  success:
    boolean;

  application:
    AdminApplication;
};

type DocumentResponse = {
  success:
    boolean;

  url:
    string;

  expiresAt:
    number;
};

/* =========================================================
   API URL
   ========================================================= */

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

/* =========================================================
   ERROR
   ========================================================= */

async function getApiError(
  response:
    Response,

  language:
    Language,
) {
  try {
    const body =
      (await response.json()) as {
        message?:
          | string
          | ApiLocalizedMessage;
      };

    if (
      typeof body.message ===
      "string"
    ) {
      return body.message;
    }

    if (
      body.message &&
      typeof body.message[
        language
      ] ===
        "string"
    ) {
      return body.message[
        language
      ] as string;
    }

    if (
      body.message &&
      typeof body.message.en ===
        "string"
    ) {
      return body
        .message
        .en;
    }
  } catch {
    //
  }

  return language ===
    "am"
    ? "አንድ ችግር ተፈጥሯል።"
    : "Something went wrong.";
}

/* =========================================================
   LIST
   ========================================================= */

export async function getAdminApplications(
  options: {
    language:
      Language;

    search?:
      string;

    status?:
      ApplicationFilterStatus;

    page?:
      number;

    limit?:
      number;
  },
): Promise<AdminApplicationsResult> {
  const {
    language,
    search = "",
    status = "all",
    page = 1,
    limit = 20,
  } =
    options;

  const params =
    new URLSearchParams();

  /*
    Makes APP-1001 searches work even if the backend is
    currently comparing against the numeric application
    number.
  */

  const normalizedSearch =
    search
      .trim()
      .replace(
        /^APP-/i,
        "",
      );

  if (
    normalizedSearch
  ) {
    params.set(
      "search",
      normalizedSearch,
    );
  }

  params.set(
    "status",
    status,
  );

  params.set(
    "page",
    String(
      page,
    ),
  );

  params.set(
    "limit",
    String(
      limit,
    ),
  );

  const response =
    await fetch(
      `${getApiUrl()}/api/admin/applications?${params.toString()}`,
      {
        method:
          "GET",

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",
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

  const result =
    (await response.json()) as
      ApplicationsResponse;

  return {
    applications:
      Array.isArray(
        result.applications,
      )
        ? result.applications
        : [],

    summary:
      result.summary,

    pagination:
      result.pagination,
  };
}

/* =========================================================
   GET ONE
   ========================================================= */

export async function getAdminApplication(
  id:
    string,

  language:
    Language,
): Promise<AdminApplication> {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/applications/${encodeURIComponent(
        id,
      )}`,
      {
        method:
          "GET",

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",
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

  const result =
    (await response.json()) as
      ApplicationResponse;

  return result.application;
}

/* =========================================================
   UPDATE STATUS + NOTES
   ========================================================= */

export async function updateAdminApplication(
  id:
    string,

  input: {
    status:
      ApplicationStatus;

    adminNotes?:
      string;
  },

  language:
    Language,
): Promise<AdminApplication> {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/applications/${encodeURIComponent(
        id,
      )}/status`,
      {
        method:
          "PATCH",

        credentials:
          "include",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        body:
          JSON.stringify(
            input,
          ),
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

  const result =
    (await response.json()) as
      ApplicationResponse;

  return result.application;
}

/* =========================================================
   PRIVATE DOCUMENT URL
   ========================================================= */

export async function getAdminApplicationDocument(
  id:
    string,

  side:
    ApplicationDocumentSide,

  language:
    Language,
): Promise<DocumentResponse> {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/applications/${encodeURIComponent(
        id,
      )}/document/${side}`,
      {
        method:
          "GET",

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",
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

  return response.json();
}

export async function getAdminApplicationInsight(
  id:
    string,

  language:
    Language,
) {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/applications/${encodeURIComponent(
        id,
      )}/insight`,
      {
        method:
          "GET",

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",
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

  const result =
    await response.json() as {
      insight:
        AdminApplicationInsight;
    };

  return result.insight;
}

export async function addAdminVerifiedSale(
  applicationId:
    string,

  language:
    Language,

  input?: {
    reference?:
      string;

    note?:
      string;
  },
) {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/applications/${encodeURIComponent(
        applicationId,
      )}/verified-sales`,
      {
        method:
          "POST",

        credentials:
          "include",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            input ??
            {},
          ),
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
}

export async function reverseAdminVerifiedSale(
  applicationId:
    string,

  saleId:
    string,

  language:
    Language,

  note =
    "",
) {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/applications/${encodeURIComponent(
        applicationId,
      )}/verified-sales/${encodeURIComponent(
        saleId,
      )}/reverse`,
      {
        method:
          "POST",

        credentials:
          "include",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            note,
          }),
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
}
