import type {
  SiteAnalyticsRange,
  SiteLanguage,
} from "@/lib/sites-api";

/* =========================================================
   TYPES
   ========================================================= */

export type SiteHealthStatus =
  | "online"
  | "offline"
  | "not_checked"
  | "not_configured";

export type SiteHealthEndpoint = {
  configured:
    boolean;

  status:
    SiteHealthStatus;

  online:
    boolean | null;

  statusCode:
    number | null;

  responseMs:
    number | null;

  errorMessage:
    string | null;

  checkedAt:
    string | null;
};

export type SiteHealthTrendPoint = {
  date:
    string;

  frontendResponseMs:
    number | null;

  backendResponseMs:
    number | null;

  uptime:
    number | null;
};

export type AvailableSiteHealth = {
  available:
    true;

  hasData:
    boolean;

  range:
    SiteAnalyticsRange;

  from:
    string;

  to:
    string;

  monitoringEnabled:
    boolean;

  totals: {
    frontendResponseMs:
      number | null;

    backendResponseMs:
      number | null;

    uptime:
      number | null;

    incidents:
      number;

    checks:
      number;

    monitoringRuns:
      number;
  };

  current: {
    frontend:
      SiteHealthEndpoint;

    backend:
      SiteHealthEndpoint;
  };

  trend:
    SiteHealthTrendPoint[];
};

/* =========================================================
   RESPONSE TYPES
   ========================================================= */

type SiteHealthResponse = {
  success:
    boolean;

  health:
    AvailableSiteHealth;
};

type ApiMessage = {
  en?:
    string;

  am?:
    string;
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
    SiteLanguage,
) {
  try {
    const body =
      (await response.json()) as {
        message?:
          | string
          | ApiMessage;
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
      return body.message.en;
    }
  } catch {
    /*
      Fall through.
    */
  }

  return language ===
    "am"
    ? "Health data መጫን አልተቻለም።"
    : "Unable to load health data.";
}

/* =========================================================
   GET HEALTH
   ========================================================= */

export async function getSiteHealth(
  id:
    string,

  range:
    SiteAnalyticsRange,

  language:
    SiteLanguage,
): Promise<
  AvailableSiteHealth
> {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/sites/${encodeURIComponent(
        id,
      )}/health?range=${encodeURIComponent(
        range,
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

  const data =
    (await response.json()) as SiteHealthResponse;

  return data.health;
}