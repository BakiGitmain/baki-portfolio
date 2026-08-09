import type {
  SiteAnalyticsRange,
  SiteLanguage,
} from "@/lib/sites-api";

/* =========================================================
   TYPES
   ========================================================= */

export type PerformanceRating =
  | "good"
  | "needs-improvement"
  | "poor";

export type SitePerformanceMetric = {
  value:
    number | null;

  rating:
    PerformanceRating | null;

  samples:
    number;
};

export type SitePerformanceTrendPoint = {
  date:
    string;

  lcp:
    number | null;

  inp:
    number | null;

  cls:
    number | null;

  performanceScore:
    number | null;
};

export type AvailableSitePerformance = {
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

  totals: {
    lcp:
      SitePerformanceMetric;

    inp:
      SitePerformanceMetric;

    cls:
      SitePerformanceMetric;

    performanceScore:
      number | null;

    metricSamples:
      number;
  };

  trend:
    SitePerformanceTrendPoint[];
};

/* =========================================================
   RESPONSE
   ========================================================= */

type PerformanceResponse = {
  success:
    boolean;

  performance:
    AvailableSitePerformance;
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
    //
  }

  return language ===
    "am"
    ? "Performance data መጫን አልተቻለም።"
    : "Unable to load performance data.";
}

/* =========================================================
   GET PERFORMANCE
   ========================================================= */

export async function getSitePerformance(
  id:
    string,

  range:
    SiteAnalyticsRange,

  language:
    SiteLanguage,
): Promise<
  AvailableSitePerformance
> {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/sites/${encodeURIComponent(
        id,
      )}/performance?range=${encodeURIComponent(
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
    (await response.json()) as PerformanceResponse;

  return data.performance;
}