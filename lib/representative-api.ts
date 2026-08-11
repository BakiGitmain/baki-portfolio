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

export type RepresentativeReportCategory =
  | "lead"
  | "follow_up"
  | "meeting"
  | "issue"
  | "other";

export type RepresentativeReportStatus =
  | "submitted"
  | "reviewing"
  | "contacted"
  | "qualified"
  | "won"
  | "lost"
  | "closed";

export type RepresentativeReport = {
  id:
    string;

  category:
    RepresentativeReportCategory;

  title:
    string;

  businessName:
    string;

  contactName:
    string | null;

  clientPhone:
    string | null;

  clientEmail:
    string | null;

  estimatedBudget:
    number | null;

  details:
    string;

  status:
    RepresentativeReportStatus;

  createdAt:
    string;

  updatedAt:
    string;
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

    active:
      number;

    won:
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

    category:
      RepresentativeReportCategory;

    title:
      string;

    businessName:
      string;

    status:
      RepresentativeReportStatus;

    createdAt:
      string;
  }>;
};

export type CreateRepresentativeReportInput = {
  category:
    RepresentativeReportCategory;

  title:
    string;

  businessName:
    string;

  contactName:
    string;

  clientPhone:
    string;

  clientEmail:
    string;

  estimatedBudget:
    number | null;

  details:
    string;
};

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

async function getErrorMessage(
  response:
    Response,
) {
  try {
    const body =
      await response.json();

    if (
      typeof body
        ?.message ===
      "string"
    ) {
      return body.message;
    }

    if (
      typeof body
        ?.message
        ?.en ===
      "string"
    ) {
      return body
        .message
        .en;
    }
  } catch {
    //
  }

  return "Something went wrong.";
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
    throw new Error(
      await getErrorMessage(
        response,
      ),
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
    throw new Error(
      await getErrorMessage(
        response,
      ),
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
    }>(
      "/api/representative/reports",
    );

  return result.reports;
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