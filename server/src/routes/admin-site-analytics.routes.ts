import {
  Router,
} from "express";

import {
  z,
} from "zod";

import {
  db,
} from "../config/db.js";

import {
  requireAdmin,
} from "../middleware/auth.middleware.js";

/* =========================================================
   ROUTER
   ========================================================= */

const router =
  Router();

/* =========================================================
   TYPES
   ========================================================= */

type AnalyticsRange =
  | "7d"
  | "30d"
  | "90d";

type TimeGranularity =
  | "day"
  | "week";

type SiteRow = {
  id:
    string;

  name:
    string;

  slug:
    string;

  frontend_url:
    string;

  backend_url:
    string | null;

  health_url:
    string | null;

  vercel_project_id:
    string | null;

  vercel_team_id:
    string | null;

  analytics_enabled:
    boolean;

  monitoring_enabled:
    boolean;
};

type UnknownRecord =
  Record<
    string,
    unknown
  >;

type AnalyticsCount = {
  visitors:
    number;

  pageViews:
    number;
};

type AnalyticsTrendPoint = {
  date:
    string;

  visitors:
    number;

  pageViews:
    number;
};

type AnalyticsDimension = {
  name:
    string;

  visitors:
    number;

  pageViews:
    number;
};

type ResolvedAnalyticsRange = {
  effectiveDays:
    number;

  sinceDate:
    Date;

  since:
    string;

  until:
    string;

  trendRaw:
    unknown;

  trendGranularity:
    TimeGranularity;

  limited:
    boolean;
};

/* =========================================================
   VERCEL ERROR
   ========================================================= */

class VercelAnalyticsError extends Error {
  status:
    number;

  code:
    string | null;

  url:
    string;

  responseText:
    string;

  constructor({
    status,
    code,
    message,
    url,
    responseText,
  }: {
    status:
      number;

    code:
      string | null;

    message:
      string;

    url:
      string;

    responseText:
      string;
  }) {
    super(
      message,
    );

    this.name =
      "VercelAnalyticsError";

    this.status =
      status;

    this.code =
      code;

    this.url =
      url;

    this.responseText =
      responseText;
  }
}

/* =========================================================
   VALIDATION
   ========================================================= */

const idSchema =
  z
    .string()
    .uuid();

const rangeSchema =
  z.enum([
    "7d",
    "30d",
    "90d",
  ]);

/* =========================================================
   VERCEL
   ========================================================= */

const VERCEL_ANALYTICS_BASE_URL =
  "https://api.vercel.com/v1/query/web-analytics";

/* =========================================================
   OBJECT HELPERS
   ========================================================= */

function isRecord(
  value:
    unknown,
): value is UnknownRecord {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function asNumber(
  value:
    unknown,
) {
  if (
    typeof value ===
      "number" &&
    Number.isFinite(
      value,
    )
  ) {
    return value;
  }

  if (
    typeof value ===
      "string"
  ) {
    const parsed =
      Number(
        value,
      );

    if (
      Number.isFinite(
        parsed,
      )
    ) {
      return parsed;
    }
  }

  return 0;
}

function asString(
  value:
    unknown,
) {
  return typeof value ===
    "string"
    ? value
    : "";
}

function firstNumber(
  row:
    UnknownRecord,

  keys:
    string[],
) {
  for (
    const key of keys
  ) {
    if (
      !(key in row)
    ) {
      continue;
    }

    return asNumber(
      row[
        key
      ],
    );
  }

  return 0;
}

function firstString(
  row:
    UnknownRecord,

  keys:
    string[],
) {
  for (
    const key of keys
  ) {
    const value =
      asString(
        row[
          key
        ],
      ).trim();

    if (
      value
    ) {
      return value;
    }
  }

  return "";
}

/* =========================================================
   DATE HELPERS
   ========================================================= */

function startOfUtcDay(
  date:
    Date,
) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );
}

function addUtcDays(
  date:
    Date,

  days:
    number,
) {
  const result =
    new Date(
      date,
    );

  result.setUTCDate(
    result.getUTCDate() +
      days,
  );

  return result;
}

function formatDate(
  date:
    Date,
) {
  return date
    .toISOString()
    .slice(
      0,
      10,
    );
}

function normalizeDate(
  value:
    unknown,
) {
  if (
    typeof value ===
      "number"
  ) {
    const date =
      new Date(
        value,
      );

    if (
      !Number.isNaN(
        date.getTime(),
      )
    ) {
      return formatDate(
        date,
      );
    }
  }

  if (
    typeof value ===
      "string"
  ) {
    if (
      /^\d{4}-\d{2}-\d{2}/.test(
        value,
      )
    ) {
      return value.slice(
        0,
        10,
      );
    }

    const numericValue =
      Number(
        value,
      );

    if (
      Number.isFinite(
        numericValue,
      )
    ) {
      const numericDate =
        new Date(
          numericValue,
        );

      if (
        !Number.isNaN(
          numericDate.getTime(),
        )
      ) {
        return formatDate(
          numericDate,
        );
      }
    }

    const date =
      new Date(
        value,
      );

    if (
      !Number.isNaN(
        date.getTime(),
      )
    ) {
      return formatDate(
        date,
      );
    }
  }

  return "";
}

/* =========================================================
   RANGE HELPERS
   ========================================================= */

function getRequestedDays(
  range:
    AnalyticsRange,
) {
  switch (
    range
  ) {
    case "30d":
      return 30;

    case "90d":
      return 90;

    default:
      return 7;
  }
}

/*
  We try the user's requested range first.

  If Vercel rejects it because the current plan does not
  expose that much historical data, we automatically try
  progressively smaller windows.
*/

function getCandidateRanges(
  requestedDays:
    number,
) {
  if (
    requestedDays >=
    90
  ) {
    return [
      90,
      30,
      28,
      14,
      7,
    ];
  }

  if (
    requestedDays >=
    30
  ) {
    return [
      30,
      28,
      14,
      7,
    ];
  }

  return [
    7,
  ];
}

function getTimeGranularity(
  days:
    number,
): TimeGranularity {
  /*
    Vercel rejected daily grouping beyond 62 days
    for this project.

    For larger windows we use weekly aggregation.
  */

  return days >
    62
    ? "week"
    : "day";
}

function percentageChange(
  current:
    number,

  previous:
    number | null,
): number | null {
  if (
    previous ===
    null
  ) {
    return null;
  }

  if (
    previous ===
    0
  ) {
    if (
      current ===
      0
    ) {
      return 0;
    }

    /*
      Growth from zero cannot be represented as a normal
      percentage without being misleading.
    */

    return null;
  }

  return (
    ((current -
      previous) /
      previous) *
    100
  );
}

function round(
  value:
    number,

  digits =
    2,
) {
  const multiplier =
    10 **
    digits;

  return (
    Math.round(
      value *
        multiplier,
    ) /
    multiplier
  );
}

/* =========================================================
   VERCEL ERROR HELPERS
   ========================================================= */

function isRangeLimitError(
  error:
    unknown,
) {
  if (
    !(
      error instanceof
      VercelAnalyticsError
    )
  ) {
    return false;
  }

  if (
    error.status !==
    400
  ) {
    return false;
  }

  if (
    error.code ===
    "invalid_group_by"
  ) {
    return true;
  }

  const message =
    error.message.toLowerCase();

  return (
    message.includes(
      "latest",
    ) &&
    message.includes(
      "days",
    )
  ) ||
    message.includes(
      "date range",
    ) ||
    message.includes(
      "reporting window",
    ) ||
    message.includes(
      "granularity",
    ) ||
    message.includes(
      "can only query up to",
    );
}

function isAnalyticsNotEnabledError(
  error:
    unknown,
) {
  return (
    error instanceof
      VercelAnalyticsError &&
    error.code ===
      "web_analytics_not_enabled"
  );
}

function logVercelError(
  error:
    VercelAnalyticsError,
) {
  console.error(
    "=========================================",
  );

  console.error(
    "VERCEL ANALYTICS REQUEST FAILED",
  );

  console.error(
    "Status:",
    error.status,
  );

  console.error(
    "Code:",
    error.code,
  );

  console.error(
    "URL:",
    error.url,
  );

  console.error(
    "Response:",
    error.responseText,
  );

  console.error(
    "=========================================",
  );
}

/* =========================================================
   API RESPONSE HELPERS
   ========================================================= */

function getData(
  value:
    unknown,
) {
  if (
    isRecord(
      value,
    ) &&
    "data" in value
  ) {
    return value.data;
  }

  return value;
}

function getRows(
  value:
    unknown,
): UnknownRecord[] {
  const data =
    getData(
      value,
    );

  if (
    Array.isArray(
      data,
    )
  ) {
    return data.filter(
      isRecord,
    );
  }

  if (
    isRecord(
      data,
    ) &&
    Array.isArray(
      data.rows,
    )
  ) {
    return data.rows.filter(
      isRecord,
    );
  }

  return [];
}

function parseCount(
  value:
    unknown,
): AnalyticsCount {
  const data =
    getData(
      value,
    );

  if (
    !isRecord(
      data,
    )
  ) {
    return {
      visitors:
        0,

      pageViews:
        0,
    };
  }

  return {
    visitors:
      firstNumber(
        data,
        [
          "visitors",
          "uniqueVisitors",
          "unique_visitors",
        ],
      ),

    pageViews:
      firstNumber(
        data,
        [
          "pageviews",
          "pageViews",
          "views",
          "count",
        ],
      ),
  };
}

function parseTrend(
  value:
    unknown,
): AnalyticsTrendPoint[] {
  return getRows(
    value,
  )
    .map(
      (
        row,
      ) => {
        const date =
          normalizeDate(
            row.timestamp ??
              row.date ??
              row.day ??
              row.week ??
              row.time ??
              row.interval,
          );

        return {
          date,

          visitors:
            firstNumber(
              row,
              [
                "visitors",
                "uniqueVisitors",
                "unique_visitors",
              ],
            ),

          pageViews:
            firstNumber(
              row,
              [
                "pageviews",
                "pageViews",
                "views",
                "count",
              ],
            ),
        };
      },
    )
    .filter(
      (
        row,
      ) =>
        Boolean(
          row.date,
        ),
    )
    .sort(
      (
        left,
        right,
      ) =>
        left.date.localeCompare(
          right.date,
        ),
    );
}

function parseDimension(
  value:
    unknown,

  dimensionKeys:
    string[],

  fallback:
    string,
): AnalyticsDimension[] {
  return getRows(
    value,
  )
    .map(
      (
        row,
      ) => {
        const name =
          firstString(
            row,
            [
              ...dimensionKeys,
              "name",
              "key",
              "value",
            ],
          ) ||
          fallback;

        return {
          name,

          visitors:
            firstNumber(
              row,
              [
                "visitors",
                "uniqueVisitors",
                "unique_visitors",
              ],
            ),

          pageViews:
            firstNumber(
              row,
              [
                "pageviews",
                "pageViews",
                "views",
                "count",
              ],
            ),
        };
      },
    )
    .sort(
      (
        left,
        right,
      ) =>
        right.pageViews -
        left.pageViews,
    );
}

/* =========================================================
   VERCEL REQUEST
   ========================================================= */

async function queryVercel({
  endpoint,
  site,
  since,
  until,
  by,
  limit,
  silentError =
    false,
}: {
  endpoint:
    "visits/count"
    | "visits/aggregate";

  site:
    SiteRow;

  since:
    string;

  until:
    string;

  by?:
    string;

  limit?:
    number;

  silentError?:
    boolean;
}) {
  const token =
    process.env
      .VERCEL_ACCESS_TOKEN
      ?.trim();

  if (
    !token
  ) {
    throw new Error(
      "VERCEL_ACCESS_TOKEN is missing.",
    );
  }

  if (
    !site.vercel_project_id
  ) {
    throw new Error(
      "Vercel Project ID is missing.",
    );
  }

  const url =
    new URL(
      `${VERCEL_ANALYTICS_BASE_URL}/${endpoint}`,
    );

  /* =======================================================
     PROJECT
     ======================================================= */

  url.searchParams.set(
    "projectId",
    site.vercel_project_id,
  );

  /* =======================================================
     TEAM
     ======================================================= */

  if (
    site.vercel_team_id
  ) {
    url.searchParams.set(
      "teamId",
      site.vercel_team_id,
    );
  }

  /* =======================================================
     RANGE
     ======================================================= */

  url.searchParams.set(
    "since",
    since,
  );

  url.searchParams.set(
    "until",
    until,
  );

  /* =======================================================
     GROUPING
     ======================================================= */

  if (
    by
  ) {
    url.searchParams.set(
      "by",
      by,
    );
  }

  /* =======================================================
     LIMIT
     ======================================================= */

  if (
    typeof limit ===
      "number"
  ) {
    url.searchParams.set(
      "limit",
      String(
        limit,
      ),
    );
  }

  /* =======================================================
     FETCH
     ======================================================= */

  const response =
    await fetch(
      url,
      {
        method:
          "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,

          Accept:
            "application/json",
        },
      },
    );

  const responseText =
    await response.text();

  /* =======================================================
     ERROR
     ======================================================= */

  if (
    !response.ok
  ) {
    let code:
      string | null =
        null;

    let message =
      responseText ||
      `Vercel Analytics returned ${response.status}.`;

    try {
      const parsed =
        JSON.parse(
          responseText,
        ) as {
          error?: {
            code?:
              string;

            message?:
              string;
          };
        };

      code =
        parsed.error?.code ??
        null;

      message =
        parsed.error?.message ??
        message;
    } catch {
      /*
        Leave the original response text as the message.
      */
    }

    const error =
      new VercelAnalyticsError({
        status:
          response.status,

        code,

        message,

        url:
          url.toString(),

        responseText,
      });

    if (
      !silentError
    ) {
      logVercelError(
        error,
      );
    }

    throw error;
  }

  /* =======================================================
     EMPTY RESPONSE
     ======================================================= */

  if (
    !responseText
  ) {
    return {};
  }

  /* =======================================================
     JSON
     ======================================================= */

  try {
    return JSON.parse(
      responseText,
    ) as unknown;
  } catch {
    /*
      An empty object is safer than breaking analytics
      because of an unexpected empty/malformed response.
    */

    return {};
  }
}

/* =========================================================
   RESOLVE EFFECTIVE RANGE

   Example on the user's Hobby plan:

   7D:
      7 days -> succeeds

   30D:
      30 days -> succeeds

   90D:
      90 days -> rejected because history is unavailable
      30 days -> succeeds

   The expected failed attempt is silent.
   ========================================================= */

async function resolveEffectiveRange({
  site,
  requestedDays,
  today,
}: {
  site:
    SiteRow;

  requestedDays:
    number;

  today:
    Date;
}): Promise<ResolvedAnalyticsRange> {
  const candidates =
    getCandidateRanges(
      requestedDays,
    );

  let lastError:
    unknown =
      null;

  for (
    let index =
      0;
    index <
    candidates.length;
    index +=
      1
  ) {
    const candidateDays =
      candidates[
        index
      ];

    const isLastCandidate =
      index ===
      candidates.length -
        1;

    const sinceDate =
      addUtcDays(
        today,
        -(
          candidateDays -
          1
        ),
      );

    const since =
      formatDate(
        sinceDate,
      );

    const until =
      formatDate(
        today,
      );

    const trendGranularity =
      getTimeGranularity(
        candidateDays,
      );

    try {
      const trendRaw =
        await queryVercel({
          endpoint:
            "visits/aggregate",

          site,

          since,

          until,

          by:
            trendGranularity,

          limit:
            100,

          /*
            We expect some candidate ranges to fail while
            discovering what Vercel permits.

            Do not dump those expected failures into the
            terminal.
          */

          silentError:
            !isLastCandidate,
        });

      return {
        effectiveDays:
          candidateDays,

        sinceDate,

        since,

        until,

        trendRaw,

        trendGranularity,

        limited:
          candidateDays <
          requestedDays,
      };
    } catch (
      error
    ) {
      lastError =
        error;

      /* ===================================================
         ANALYTICS DISABLED

         This is not a range problem.
         Do not continue trying smaller ranges.
         =================================================== */

      if (
        isAnalyticsNotEnabledError(
          error,
        )
      ) {
        throw error;
      }

      /* ===================================================
         REPORTING WINDOW / GRANULARITY

         Try the next smaller candidate.
         =================================================== */

      if (
        isRangeLimitError(
          error,
        ) &&
        !isLastCandidate
      ) {
        continue;
      }

      /* ===================================================
         UNEXPECTED ERROR

         If the request was intentionally silent while
         probing ranges, log it now because it wasn't an
         expected range-limit failure.
         =================================================== */

      if (
        error instanceof
          VercelAnalyticsError &&
        !isRangeLimitError(
          error,
        )
      ) {
        logVercelError(
          error,
        );
      }

      throw error;
    }
  }

  throw (
    lastError ??
    new Error(
      "Unable to resolve analytics reporting range.",
    )
  );
}

/* =========================================================
   PREVIOUS PERIOD

   If the plan cannot expose enough history for the previous
   period, comparison simply becomes unavailable.

   Current analytics still succeed.
   ========================================================= */

async function getPreviousCount({
  site,
  since,
  until,
}: {
  site:
    SiteRow;

  since:
    string;

  until:
    string;
}): Promise<
  AnalyticsCount | null
> {
  try {
    const raw =
      await queryVercel({
        endpoint:
          "visits/count",

        site,

        since,

        until,

        /*
          Previous-period range limits are expected on
          shorter-history plans, so keep them quiet.
        */

        silentError:
          true,
      });

    return parseCount(
      raw,
    );
  } catch (
    error
  ) {
    /*
      Hobby, or another shorter-history plan, may not
      expose the previous period.

      This is not fatal.
    */

    if (
      isRangeLimitError(
        error,
      )
    ) {
      return null;
    }

    /*
      Analytics disabled is handled by the main route.
    */

    if (
      isAnalyticsNotEnabledError(
        error,
      )
    ) {
      throw error;
    }

    /*
      Authentication, permission or unexpected API problems
      are real errors and should not be hidden.
    */

    if (
      error instanceof
        VercelAnalyticsError
    ) {
      logVercelError(
        error,
      );
    }

    throw error;
  }
}

/* =========================================================
   SAFE DIMENSION AGGREGATE

   Top pages / countries / devices / referrers should never
   destroy the whole analytics page merely because one
   secondary Vercel dimension is temporarily unavailable.
   ========================================================= */

async function safeAggregate({
  site,
  since,
  until,
  by,
  limit,
}: {
  site:
    SiteRow;

  since:
    string;

  until:
    string;

  by:
    string;

  limit:
    number;
}) {
  try {
    return await queryVercel({
      endpoint:
        "visits/aggregate",

      site,

      since,

      until,

      by,

      limit,

      /*
        We handle expected dimension/range failures below.
      */

      silentError:
        true,
    });
  } catch (
    error
  ) {
    if (
      isRangeLimitError(
        error,
      )
    ) {
      return {
        data:
          [],
      };
    }

    if (
      error instanceof
        VercelAnalyticsError &&
      error.status ===
        400 &&
      error.code ===
        "invalid_group_by"
    ) {
      return {
        data:
          [],
      };
    }

    if (
      isAnalyticsNotEnabledError(
        error,
      )
    ) {
      throw error;
    }

    if (
      error instanceof
        VercelAnalyticsError
    ) {
      logVercelError(
        error,
      );
    }

    throw error;
  }
}

/* =========================================================
   AUTH
   ========================================================= */

router.use(
  requireAdmin,
);

/* =========================================================
   GET SITE ANALYTICS
   ========================================================= */

router.get(
  "/:id/analytics",

  async (
    req,
    res,
  ) => {
    /* =====================================================
       ID
       ===================================================== */

    const parsedId =
      idSchema.safeParse(
        req.params.id,
      );

    if (
      !parsedId.success
    ) {
      res
        .status(
          400,
        )
        .json({
          success:
            false,

          message: {
            en:
              "Invalid site ID.",

            am:
              "የድረ-ገጹ ID ትክክል አይደለም።",
          },
        });

      return;
    }

    /* =====================================================
       RANGE
       ===================================================== */

    const parsedRange =
      rangeSchema.safeParse(
        req.query.range ??
          "7d",
      );

    if (
      !parsedRange.success
    ) {
      res
        .status(
          400,
        )
        .json({
          success:
            false,

          message: {
            en:
              "Invalid analytics range.",

            am:
              "የAnalytics ጊዜ ክሉ ትክክል አይደለም።",
          },
        });

      return;
    }

    /* =====================================================
       SITE
       ===================================================== */

    const siteResult =
      await db.query<SiteRow>(
        `
          SELECT
            id,
            name,
            slug,

            frontend_url,
            backend_url,
            health_url,

            vercel_project_id,
            vercel_team_id,

            analytics_enabled,
            monitoring_enabled

          FROM monitored_sites

          WHERE id = $1

          LIMIT 1
        `,
        [
          parsedId.data,
        ],
      );

    const site =
      siteResult.rows[
        0
      ];

    if (
      !site
    ) {
      res
        .status(
          404,
        )
        .json({
          success:
            false,

          message: {
            en:
              "Site not found.",

            am:
              "ድረ-ገጹ አልተገኘም።",
          },
        });

      return;
    }

    /* =====================================================
       ANALYTICS TOGGLE
       ===================================================== */

    if (
      !site.analytics_enabled
    ) {
      res.json({
        success:
          true,

        analytics: {
          available:
            false,

          reason:
            "ANALYTICS_DISABLED",

          message: {
            en:
              "Analytics is disabled for this site.",

            am:
              "Analytics ለዚህ site ተዘግቷል።",
          },
        },
      });

      return;
    }

    /* =====================================================
       VERCEL PROJECT
       ===================================================== */

    if (
      !site.vercel_project_id
    ) {
      res.json({
        success:
          true,

        analytics: {
          available:
            false,

          reason:
            "PROJECT_ID_MISSING",

          message: {
            en:
              "Add the Vercel Project ID to this site first.",

            am:
              "በመጀመሪያ Vercel Project ID ወደዚህ site ያክሉ።",
          },
        },
      });

      return;
    }

    /* =====================================================
       VERCEL TOKEN
       ===================================================== */

    if (
      !process.env
        .VERCEL_ACCESS_TOKEN
        ?.trim()
    ) {
      res.json({
        success:
          true,

        analytics: {
          available:
            false,

          reason:
            "TOKEN_MISSING",

          message: {
            en:
              "VERCEL_ACCESS_TOKEN is not configured on the backend.",

            am:
              "VERCEL_ACCESS_TOKEN በbackend ላይ አልተዘጋጀም።",
          },
        },
      });

      return;
    }

    /* =====================================================
       FETCH ANALYTICS
       ===================================================== */

    try {
      const range =
        parsedRange.data;

      const requestedDays =
        getRequestedDays(
          range,
        );

      const today =
        startOfUtcDay(
          new Date(),
        );

      /* ===================================================
         DETERMINE LARGEST AVAILABLE RANGE
         =================================================== */

      const resolved =
        await resolveEffectiveRange({
          site,

          requestedDays,

          today,
        });

      const {
        effectiveDays,
        sinceDate,
        since,
        until,
        trendRaw,
        trendGranularity,
        limited,
      } =
        resolved;

      /* ===================================================
         CURRENT COUNT
         =================================================== */

      const currentCountRaw =
        await queryVercel({
          endpoint:
            "visits/count",

          site,

          since,

          until,
        });

      const current =
        parseCount(
          currentCountRaw,
        );

      /* ===================================================
         PREVIOUS PERIOD

         Example:

         7D:
           current 7
           previous 7

         30D on Hobby:
           current succeeds
           previous may be inaccessible
           comparison becomes null

         It NEVER destroys current analytics.
         =================================================== */

      const previousUntilDate =
        addUtcDays(
          sinceDate,
          -1,
        );

      const previousSinceDate =
        addUtcDays(
          previousUntilDate,
          -(
            effectiveDays -
            1
          ),
        );

      const previous =
        await getPreviousCount({
          site,

          since:
            formatDate(
              previousSinceDate,
            ),

          until:
            formatDate(
              previousUntilDate,
            ),
        });

      /* ===================================================
         BREAKDOWNS

         Supported Vercel dimensions include request path,
         country, device type and referrer hostname.
         =================================================== */

      const [
        pagesRaw,
        countriesRaw,
        devicesRaw,
        referrersRaw,
      ] =
        await Promise.all([
          safeAggregate({
            site,

            since,

            until,

            by:
              "requestPath",

            limit:
              10,
          }),

          safeAggregate({
            site,

            since,

            until,

            by:
              "country",

            limit:
              10,
          }),

          safeAggregate({
            site,

            since,

            until,

            by:
              "deviceType",

            limit:
              10,
          }),

          safeAggregate({
            site,

            since,

            until,

            by:
              "referrerHostname",

            limit:
              10,
          }),
        ]);

      /* ===================================================
         TREND
         =================================================== */

      const trend =
        parseTrend(
          trendRaw,
        );

      /* ===================================================
         TOP PAGES
         =================================================== */

      const topPages =
        parseDimension(
          pagesRaw,
          [
            "requestPath",
            "route",
            "path",
          ],
          "/",
        ).slice(
          0,
          8,
        );

      /* ===================================================
         COUNTRIES
         =================================================== */

      const countries =
        parseDimension(
          countriesRaw,
          [
            "country",
          ],
          "Unknown",
        ).slice(
          0,
          8,
        );

      /* ===================================================
         DEVICES
         =================================================== */

      const devices =
        parseDimension(
          devicesRaw,
          [
            "deviceType",
            "device",
          ],
          "Unknown",
        )
          .sort(
            (
              left,
              right,
            ) =>
              right.visitors -
              left.visitors,
          )
          .slice(
            0,
            6,
          );

      /* ===================================================
         REFERRERS
         =================================================== */

      const referrers =
        parseDimension(
          referrersRaw,
          [
            "referrerHostname",
            "referrer",
          ],
          "Direct",
        ).slice(
          0,
          8,
        );

      /* ===================================================
         RESPONSE
         =================================================== */

      res.json({
        success:
          true,

        analytics: {
          available:
            true,

          /*
            What the user selected.
          */

          range,

          requestedDays,

          /*
            What Vercel actually allowed us to retrieve.

            Example:
            selected 90D
            Hobby allows ~30D
            effectiveDays = 30
          */

          effectiveDays,

          limited,

          limitedToDays:
            limited
              ? effectiveDays
              : null,

          /*
            Useful later if the frontend wants to display
            Daily / Weekly.
          */

          trendGranularity,

          from:
            since,

          to:
            until,

          comparisonAvailable:
            previous !==
            null,

          totals: {
            visitors:
              current.visitors,

            pageViews:
              current.pageViews,

            viewsPerVisitor:
              current.visitors >
              0
                ? round(
                    current.pageViews /
                      current.visitors,
                  )
                : 0,

            visitorChange:
              percentageChange(
                current.visitors,
                previous?.visitors ??
                  null,
              ),

            pageViewChange:
              percentageChange(
                current.pageViews,
                previous?.pageViews ??
                  null,
              ),
          },

          trend,

          topPages,

          countries,

          devices,

          referrers,
        },
      });
    } catch (
      error
    ) {
      /* ===================================================
         WEB ANALYTICS NOT ENABLED
         =================================================== */

      if (
        isAnalyticsNotEnabledError(
          error,
        )
      ) {
        res.json({
          success:
            true,

          analytics: {
            available:
              false,

            reason:
              "VERCEL_ANALYTICS_NOT_ENABLED",

            message: {
              en:
                "Vercel Web Analytics is not enabled for this project.",

              am:
                "Vercel Web Analytics ለዚህ project አልተከፈተም።",
            },
          },
        });

        return;
      }

      /* ===================================================
         TOKEN / PERMISSION
         =================================================== */

      if (
        error instanceof
          VercelAnalyticsError &&
        (
          error.status ===
            401 ||
          error.status ===
            403
        )
      ) {
        res
          .status(
            502,
          )
          .json({
            success:
              false,

            message: {
              en:
                "Vercel rejected the analytics access token. Check the token and its project permissions.",

              am:
                "Vercel analytics access tokenን አልተቀበለውም። Token እና project permission ያረጋግጡ።",
            },
          });

        return;
      }

      /* ===================================================
         UNKNOWN ERROR
         =================================================== */

      console.error(
        "Site analytics error:",
        error,
      );

      res
        .status(
          502,
        )
        .json({
          success:
            false,

          message: {
            en:
              "Unable to load analytics from Vercel. Check the backend terminal for the exact Vercel response.",

            am:
              "Analyticsን ከVercel መጫን አልተቻለም። ትክክለኛውን Vercel error ለማየት backend terminal ይመልከቱ።",
          },
        });
    }
  },
);

export default router;