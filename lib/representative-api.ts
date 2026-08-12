/* =========================================================
   TYPES
   ========================================================= */

export type RepresentativeUser = {
  id:
    string;

  username:
    string;

  name:
    string;

  email:
    string;

  role:
    "representative";

  mustChangePassword:
    boolean;
};

export type RepresentativeReportReply = {
  id:
    string;

  message:
    string;

  readAt:
    string | null;

  createdAt:
    string;

  updatedAt:
    string;
};

export type RepresentativeReport = {
  id:
    string;

  message:
    string;

  adminReadAt:
    string | null;

  replies:
    RepresentativeReportReply[];

  createdAt:
    string;

  updatedAt:
    string;
};

export type RepresentativeReportCooldown = {
  canSubmit:
    boolean;

  lastReportAt:
    string | null;

  nextReportAt:
    string | null;

  remainingSeconds:
    number;
};

export type RepresentativeReportsResult = {
  reports:
    RepresentativeReport[];

  cooldown:
    RepresentativeReportCooldown;

  unreadReplyCount:
    number;
};

export type RepresentativeTrainingModule = {
  id:
    string;

  slug:
    string;

  title:
    string;

  description:
    string;

  content:
    string;

  videoUrl:
    string | null;

  durationMinutes:
    number;

  required:
    boolean;

  progressPercent:
    number;

  completed:
    boolean;

  completedAt:
    string | null;
};

export type RepresentativeResource = {
  id:
    string;

  slug:
    string;

  category:
    string;

  title:
    string;

  description:
    string;

  content:
    string;

  externalUrl:
    string | null;
};

export type RepresentativeDashboardData = {
  reports: {
    total:
      number;

    replies:
      number;

    unreadReplies:
      number;
  };

  training: {
    total:
      number;

    completed:
      number;
  };

  recentReports: Array<{
    id:
      string;

    message:
      string;

    createdAt:
      string;

    latestReply: {
      message:
        string;

      createdAt:
        string;

      readAt:
        string | null;
    } | null;
  }>;
};

export type CreateRepresentativeReportInput = {
  message:
    string;
};

export class RepresentativeApiError extends Error {
  code?:
    string;

  retryAfterSeconds?:
    number;

  nextReportAt?:
    string;

  constructor(
    message:
      string,

    options?: {
      code?:
        string;

      retryAfterSeconds?:
        number;

      nextReportAt?:
        string;
    },
  ) {
    super(
      message,
    );

    this.name =
      "RepresentativeApiError";

    this.code =
      options?.code;

    this.retryAfterSeconds =
      options
        ?.retryAfterSeconds;

    this.nextReportAt =
      options?.nextReportAt;
  }
}

/* =========================================================
   API URL
   ========================================================= */

function getApiUrl() {
  const value =
    process.env
      .NEXT_PUBLIC_API_URL;

  if (
    !value
  ) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured.",
    );
  }

  return value.replace(
    /\/$/,
    "",
  );
}

/* =========================================================
   ERRORS
   ========================================================= */

async function getApiError(
  response:
    Response,
) {
  try {
    const body =
      await response.json();

    const language =
      typeof document !==
        "undefined" &&
      document.documentElement
        .lang ===
        "am"
        ? "am"
        : "en";

    let message =
      "Something went wrong.";

    if (
      typeof body
        ?.message ===
      "string"
    ) {
      message =
        body.message;
    } else if (
      typeof body
        ?.message?.[
          language
        ] ===
      "string"
    ) {
      message =
        body.message[
          language
        ];
    } else if (
      typeof body
        ?.message
        ?.en ===
      "string"
    ) {
      message =
        body.message.en;
    }

    return new RepresentativeApiError(
      message,

      {
        code:
          typeof body?.code ===
          "string"
            ? body.code
            : undefined,

        retryAfterSeconds:
          typeof body
            ?.retryAfterSeconds ===
          "number"
            ? body
                .retryAfterSeconds
            : undefined,

        nextReportAt:
          typeof body
            ?.nextReportAt ===
          "string"
            ? body.nextReportAt
            : undefined,
      },
    );
  } catch {
    return new RepresentativeApiError(
      "Something went wrong.",
    );
  }
}

/* =========================================================
   API REQUEST
   ========================================================= */

async function apiRequest<T>(
  path:
    string,

  init?:
    RequestInit,
): Promise<T> {
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
    throw await getApiError(
      response,
    );
  }

  return response.json();
}

/* =========================================================
   LOGIN
   ========================================================= */

export async function loginRepresentative(
  username:
    string,

  password:
    string,
) {
  return apiRequest<{
    success:
      true;

    user:
      RepresentativeUser;

    redirectTo:
      string;
  }>(
    "/api/representative-auth/login",

    {
      method:
        "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify({
          username,
          password,
        }),
    },
  );
}

/* =========================================================
   CURRENT REPRESENTATIVE
   ========================================================= */

export async function getCurrentRepresentative():
  Promise<
    RepresentativeUser |
    null
  > {
  const response =
    await fetch(
      `${getApiUrl()}/api/representative-auth/me`,
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
    response.status ===
    401
  ) {
    return null;
  }

  if (
    !response.ok
  ) {
    throw await getApiError(
      response,
    );
  }

  const result =
    await response.json();

  return result.user;
}

/* =========================================================
   CHANGE PASSWORD

   First setup:
   changeRepresentativePassword(
     newPassword,
   )

   Later password change:
   changeRepresentativePassword(
     newPassword,
     currentPassword,
   )
   ========================================================= */

export async function changeRepresentativePassword(
  newPassword:
    string,

  currentPassword?:
    string,
) {
  return apiRequest<{
    success:
      true;

    redirectTo:
      string;
  }>(
    "/api/representative-auth/change-password",

    {
      method:
        "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify({
          newPassword,

          ...(
            currentPassword
              ? {
                  currentPassword,
                }
              : {}
          ),
        }),
    },
  );
}

/* =========================================================
   LOGOUT
   ========================================================= */

export async function logoutRepresentative() {
  return apiRequest<{
    success:
      true;
  }>(
    "/api/representative-auth/logout",

    {
      method:
        "POST",
    },
  );
}

/* =========================================================
   DASHBOARD
   ========================================================= */

export async function getRepresentativeDashboard() {
  const result =
    await apiRequest<{
      success:
        true;

      dashboard:
        RepresentativeDashboardData;
    }>(
      "/api/representative/dashboard",
    );

  return result.dashboard;
}

/* =========================================================
   REPORTS
   ========================================================= */

export async function getRepresentativeReports() {
  const result =
    await apiRequest<{
      success:
        true;

      reports:
        RepresentativeReport[];

      cooldown:
        RepresentativeReportCooldown;

      unreadReplyCount:
        number;
    }>(
      "/api/representative/reports",
    );

  return {
    reports:
      result.reports,

    cooldown:
      result.cooldown,

    unreadReplyCount:
      result.unreadReplyCount,
  } satisfies RepresentativeReportsResult;
}

export async function createRepresentativeReport(
  input:
    CreateRepresentativeReportInput,
) {
  const result =
    await apiRequest<{
      success:
        true;

      report:
        RepresentativeReport;
    }>(
      "/api/representative/reports",

      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            input,
          ),
      },
    );

  return result.report;
}

export async function markRepresentativeRepliesRead() {
  return apiRequest<{
    success:
      true;

    markedRead:
      number;

    unreadReplyCount:
      number;
  }>(
    "/api/representative/reports/mark-replies-read",

    {
      method:
        "POST",
    },
  );
}

/* =========================================================
   TRAINING
   ========================================================= */

export async function getRepresentativeTraining() {
  const result =
    await apiRequest<{
      success:
        true;

      modules:
        RepresentativeTrainingModule[];
    }>(
      "/api/representative/training",
    );

  return result.modules;
}

export async function completeRepresentativeTraining(
  id:
    string,
) {
  await apiRequest(
    `/api/representative/training/${encodeURIComponent(
      id,
    )}/complete`,

    {
      method:
        "POST",
    },
  );
}

/* =========================================================
   RESOURCES
   ========================================================= */

export async function getRepresentativeResources() {
  const result =
    await apiRequest<{
      success:
        true;

      resources:
        RepresentativeResource[];
    }>(
      "/api/representative/resources",
    );

  return result.resources;
}
