export type SiteLanguage =
  | "en"
  | "am";

export type MonitoredSite = {
  id:
    string;

  name:
    string;

  slug:
    string;

  frontendUrl:
    string;

  backendUrl:
    string | null;

  healthUrl:
    string | null;

  vercelProjectId:
    string | null;

  vercelTeamId:
    string | null;

  analyticsEnabled:
    boolean;

  monitoringEnabled:
    boolean;

  createdAt:
    string;

  updatedAt:
    string;
};

export type SiteInput = {
  name:
    string;

  slug:
    string;

  frontendUrl:
    string;

  backendUrl:
    string;

  healthUrl:
    string;

  vercelProjectId:
    string;

  vercelTeamId:
    string;

  analyticsEnabled:
    boolean;

  monitoringEnabled:
    boolean;
};

export type SiteAnalyticsRange =
  | "7d"
  | "30d"
  | "90d";

export type SiteAnalyticsTrendPoint = {
  date:
    string;

  visitors:
    number;

  pageViews:
    number;
};

export type SiteAnalyticsDimension = {
  name:
    string;

  visitors:
    number;

  pageViews:
    number;
};

export type AvailableSiteAnalytics = {
  available:
    true;

  range:
    SiteAnalyticsRange;

  requestedDays:
    number;

  effectiveDays:
    number;

  limited:
    boolean;

  limitedToDays:
    number | null;

  from:
    string;

  to:
    string;

  comparisonAvailable:
    boolean;

  totals: {
    visitors:
      number;

    pageViews:
      number;

    viewsPerVisitor:
      number;

    visitorChange:
      number | null;

    pageViewChange:
      number | null;
  };

  trend:
    SiteAnalyticsTrendPoint[];

  topPages:
    SiteAnalyticsDimension[];

  countries:
    SiteAnalyticsDimension[];

  devices:
    SiteAnalyticsDimension[];

  referrers:
    SiteAnalyticsDimension[];
};

export type UnavailableSiteAnalytics = {
  available:
    false;

  reason:
    string;

  message: {
    en:
      string;

    am:
      string;
  };
};

export type SiteAnalytics =
  | AvailableSiteAnalytics
  | UnavailableSiteAnalytics;

type ApiMessage = {
  en?:
    string;

  am?:
    string;
};

type SitesResponse = {
  success:
    boolean;

  sites:
    MonitoredSite[];
};

type SiteResponse = {
  success:
    boolean;

  site:
    MonitoredSite;
};

type AnalyticsResponse = {
  success:
    boolean;

  analytics:
    SiteAnalytics;
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
    ? "አንድ ችግር ተፈጥሯል።"
    : "Something went wrong.";
}

/* =========================================================
   GET ALL
   ========================================================= */

export async function getSites(
  language:
    SiteLanguage,
): Promise<
  MonitoredSite[]
> {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/sites`,
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
    (await response.json()) as SitesResponse;

  return Array.isArray(
    data.sites,
  )
    ? data.sites
    : [];
}

/* =========================================================
   GET ONE
   ========================================================= */

export async function getSite(
  id:
    string,

  language:
    SiteLanguage,
): Promise<
  MonitoredSite
> {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/sites/${encodeURIComponent(
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

  const data =
    (await response.json()) as SiteResponse;

  return data.site;
}

/* =========================================================
   ANALYTICS
   ========================================================= */

export async function getSiteAnalytics(
  id:
    string,

  range:
    SiteAnalyticsRange,

  language:
    SiteLanguage,
): Promise<
  SiteAnalytics
> {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/sites/${encodeURIComponent(
        id,
      )}/analytics?range=${encodeURIComponent(
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
    (await response.json()) as AnalyticsResponse;

  return data.analytics;
}

/* =========================================================
   CREATE
   ========================================================= */

export async function createSite(
  input:
    SiteInput,

  language:
    SiteLanguage,
): Promise<
  MonitoredSite
> {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/sites`,
      {
        method:
          "POST",

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

  const data =
    (await response.json()) as SiteResponse;

  return data.site;
}

/* =========================================================
   UPDATE
   ========================================================= */

export async function updateSite(
  id:
    string,

  input:
    SiteInput,

  language:
    SiteLanguage,
): Promise<
  MonitoredSite
> {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/sites/${encodeURIComponent(
        id,
      )}`,
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

  const data =
    (await response.json()) as SiteResponse;

  return data.site;
}

/* =========================================================
   DELETE
   ========================================================= */

export async function deleteSite(
  id:
    string,

  language:
    SiteLanguage,
) {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/sites/${encodeURIComponent(
        id,
      )}`,
      {
        method:
          "DELETE",

        credentials:
          "include",

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
}