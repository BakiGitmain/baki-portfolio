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