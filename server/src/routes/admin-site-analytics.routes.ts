import { Router } from "express";
import { z } from "zod";

import { db } from "../config/db.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

/* =========================================================
   ROUTER
   ========================================================= */

const router = Router();

/* =========================================================
   TYPES
   ========================================================= */

type AnalyticsRange = "7d" | "30d" | "90d";

type TimeGranularity = "day" | "week";

type SiteRow = {
  id: string;
  name: string;
  slug: string;

  frontend_url: string;
  backend_url: string | null;
  health_url: string | null;

  vercel_project_id: string | null;
  vercel_team_id: string | null;

  analytics_enabled: boolean;
  monitoring_enabled: boolean;
};

type UnknownRecord = Record<string, unknown>;

type AnalyticsCount = {
  visitors: number;
  pageViews: number;
};

type AnalyticsTrendPoint = {
  date: string;
  visitors: number;
  pageViews: number;
};

type AnalyticsDimension = {
  name: string;
  visitors: number;
  pageViews: number;
};

type ResolvedAnalyticsRange = {
  effectiveDays: number;

  sinceDate: Date;

  since: string;
  until: string;

  trendRaw: unknown;

  trendGranularity: TimeGranularity;

  limited: boolean;
};

/* =========================================================
   VERCEL ERROR
   ========================================================= */

class VercelAnalyticsError extends Error {
  status: number;

  code: string | null;

  url: string;

  responseText: string;

  constructor({
    status,
    code,
    message,
    url,
    responseText,
  }: {
    status: number;
    code: string | null;
    message: string;
    url: string;
    responseText: string;
  }) {
    super(message);

    this.name = "VercelAnalyticsError";

    this.status = status;
    this.code = code;
    this.url = url;
    this.responseText = responseText;
  }
}

/* =========================================================
   VALIDATION
   ========================================================= */

const idSchema = z.string().uuid();

const rangeSchema = z.enum([
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
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function toFiniteNumber(
  value: unknown,
): number | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    const parsed = Number(value);

    if (
      Number.isFinite(parsed)
    ) {
      return parsed;
    }
  }

  return null;
}

function asString(
  value: unknown,
) {
  return typeof value === "string"
    ? value
    : "";
}

function firstNumber(
  row: UnknownRecord,
  keys: string[],
) {
  for (const key of keys) {
    const number =
      toFiniteNumber(
        row[key],
      );

    if (
      number !== null
    ) {
      return number;
    }
  }

  return 0;
}

function firstString(
  row: UnknownRecord,
  keys: string[],
) {
  for (const key of keys) {
    const value =
      asString(
        row[key],
      ).trim();

    if (value) {
      return value;
    }
  }

  return "";
}

/* =========================================================
   AGGREGATE VALUE

   Vercel aggregate responses can contain the numeric
   aggregate under different property names.

   Known names are checked first.

   If none are found, the function searches for another
   finite numeric property while ignoring timestamps.
   ========================================================= */

function getAggregateValue(
  row: UnknownRecord,
) {
  const preferredKeys = [
    "pageviews",
    "pageViews",
    "page_views",
    "views",
    "count",
    "total",
    "value",
    "_count",
  ];

  for (
    const key of preferredKeys
  ) {
    const number =
      toFiniteNumber(
        row[key],
      );

    if (
      number !== null
    ) {
      return number;
    }
  }

  /* =======================================================
     SDK additional properties
     ======================================================= */

  const additionalProperties =
    row.additionalProperties;

  if (
    isRecord(
      additionalProperties,
    )
  ) {
    for (
      const value of Object.values(
        additionalProperties,
      )
    ) {
      const number =
        toFiniteNumber(
          value,
        );

      if (
        number !== null
      ) {
        return number;
      }
    }
  }

  /* =======================================================
     RAW API numeric property
     ======================================================= */

  const ignoredNumericKeys =
    new Set([
      "timestamp",
      "time",
      "version",
      "since",
      "until",
    ]);

  for (
    const [
      key,
      value,
    ] of Object.entries(
      row,
    )
  ) {
    if (
      ignoredNumericKeys.has(
        key,
      )
    ) {
      continue;
    }

    const number =
      toFiniteNumber(
        value,
      );

    if (
      number !== null
    ) {
      return number;
    }
  }

  return 0;
}

/* =========================================================
   DATE HELPERS
   ========================================================= */

function startOfUtcDay(
  date: Date,
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
  date: Date,
  days: number,
) {
  const result =
    new Date(date);

  result.setUTCDate(
    result.getUTCDate() +
      days,
  );

  return result;
}

function formatDate(
  date: Date,
) {
  return date
    .toISOString()
    .slice(
      0,
      10,
    );
}

function normalizeDate(
  value: unknown,
) {
  if (
    typeof value === "number"
  ) {
    const date =
      new Date(value);

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
    typeof value === "string"
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
      Number(value);

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
      new Date(value);

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
  range: AnalyticsRange,
) {
  switch (range) {
    case "30d":
      return 30;

    case "90d":
      return 90;

    default:
      return 7;
  }
}

/*
  Try the requested range first.

  If Vercel rejects that reporting window because the
  account only exposes less history, progressively use a
  smaller range.
*/

function getCandidateRanges(
  requestedDays: number,
) {
  if (
    requestedDays >= 90
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
    requestedDays >= 30
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
  days: number,
): TimeGranularity {
  return days > 62
    ? "week"
    : "day";
}

function percentageChange(
  current: number,
  previous: number | null,
): number | null {
  if (
    previous === null
  ) {
    return null;
  }

  if (
    previous === 0
  ) {
    if (
      current === 0
    ) {
      return 0;
    }

    return null;
  }

  return (
    ((current - previous) /
      previous) *
    100
  );
}

function round(
  value: number,
  digits = 2,
) {
  const multiplier =
    10 ** digits;

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
  error: unknown,
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
    error.status !== 400
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
    error.message
      .toLowerCase();

  return (
    (
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
    )
  );
}

function isAnalyticsNotEnabledError(
  error: unknown,
) {
  return (
    error instanceof
      VercelAnalyticsError &&
    error.code ===
      "web_analytics_not_enabled"
  );
}

function logVercelError(
  error: VercelAnalyticsError,
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
  value: unknown,
) {
  if (
    isRecord(value) &&
    "data" in value
  ) {
    return value.data;
  }

  return value;
}

function getRows(
  value: unknown,
): UnknownRecord[] {
  const data =
    getData(value);

  if (
    Array.isArray(data)
  ) {
    return data.filter(
      isRecord,
    );
  }

  if (
    isRecord(data) &&
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

/* =========================================================
   COUNT PARSER
   ========================================================= */

function parseCount(
  value: unknown,
): AnalyticsCount {
  const data =
    getData(value);

  if (
    typeof data === "number"
  ) {
    return {
      visitors: 0,
      pageViews: data,
    };
  }

  if (
    !isRecord(data)
  ) {
    return {
      visitors: 0,
      pageViews: 0,
    };
  }

  const visitors =
    firstNumber(
      data,
      [
        "visitors",
        "uniqueVisitors",
        "unique_visitors",
        "visitorCount",
      ],
    );

  const pageViews =
    getAggregateValue(
      data,
    );

  return {
    visitors,
    pageViews,
  };
}

/* =========================================================
   TREND PARSER
   ========================================================= */

function parseTrend(
  value: unknown,
): AnalyticsTrendPoint[] {
  return getRows(value)
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

        const visitors =
          firstNumber(
            row,
            [
              "visitors",
              "uniqueVisitors",
              "unique_visitors",
              "visitorCount",
            ],
          );

        const pageViews =
          getAggregateValue(
            row,
          );

        return {
          date,
          visitors,
          pageViews,
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

/* =========================================================
   DIMENSION PARSER

   Breakdown requests also include a time granularity.

   Example:

   day + deviceType

   Vercel may therefore return multiple rows for Desktop,
   one for every day.

   This Map merges those rows into one final total.
   ========================================================= */

function parseDimension(
  value: unknown,
  dimensionKeys: string[],
  fallback: string,
): AnalyticsDimension[] {
  const grouped =
    new Map<
      string,
      AnalyticsDimension
    >();

  for (
    const row of getRows(
      value,
    )
  ) {
    const name =
      firstString(
        row,
        [
          ...dimensionKeys,
          "name",
          "key",
        ],
      ) ||
      fallback;

    const pageViews =
      getAggregateValue(
        row,
      );

    const visitors =
      firstNumber(
        row,
        [
          "visitors",
          "uniqueVisitors",
          "unique_visitors",
          "visitorCount",
        ],
      );

    const existing =
      grouped.get(
        name,
      );

    if (
      existing
    ) {
      existing.pageViews +=
        pageViews;

      existing.visitors +=
        visitors;

      continue;
    }

    grouped.set(
      name,
      {
        name,
        visitors,
        pageViews,
      },
    );
  }

  return Array.from(
    grouped.values(),
  )
    .filter(
      (
        item,
      ) =>
        Boolean(
          item.name,
        ),
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

   "by" is an array.

   Example:

   by = ["day"]

   becomes:

   ?by=day

   and:

   by = ["day", "deviceType"]

   becomes:

   ?by=day&by=deviceType
   ========================================================= */

async function queryVercel({
  endpoint,
  site,
  since,
  until,
  by,
  limit,
  silentError = false,
}: {
  endpoint:
    | "visits/count"
    | "visits/aggregate";

  site: SiteRow;

  since: string;
  until: string;

  by?: string[];

  limit?: number;

  silentError?: boolean;
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

     IMPORTANT:

     These are now full ISO timestamps, not date-only
     strings.

     Example:
     2026-08-09T11:57:12.245Z
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
     GROUP BY
     ======================================================= */

  if (
    by &&
    by.length > 0
  ) {
    for (
      const dimension of by
    ) {
      url.searchParams.append(
        "by",
        dimension,
      );
    }
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
      String(limit),
    );
  }

  /* =======================================================
     FETCH
     ======================================================= */

  const response =
    await fetch(
      url,
      {
        method: "GET",

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
            code?: string;
            message?: string;
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
        Keep original response text.
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
    return {};
  }
}

/* =========================================================
   RESOLVE EFFECTIVE RANGE

   FIX:

   The old code converted "now" into today's midnight before
   making the request.

   That meant breakdown requests could stop before today's
   visits.

   Now:

   since = beginning of requested period
   until = REAL CURRENT TIME
   ========================================================= */

async function resolveEffectiveRange({
  site,
  requestedDays,
  now,
}: {
  site: SiteRow;

  requestedDays: number;

  now: Date;
}): Promise<
  ResolvedAnalyticsRange
> {
  const candidates =
    getCandidateRanges(
      requestedDays,
    );

  let lastError:
    unknown =
      null;

  const currentDayStart =
    startOfUtcDay(
      now,
    );

  for (
    let index = 0;
    index <
      candidates.length;
    index += 1
  ) {
    const candidateDays =
      candidates[index];

    const isLastCandidate =
      index ===
      candidates.length - 1;

    const sinceDate =
      addUtcDays(
        currentDayStart,
        -(
          candidateDays -
          1
        ),
      );

    /*
      Full timestamps.

      This is the important fix.
    */

    const since =
      sinceDate.toISOString();

    const until =
      now.toISOString();

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

          by: [
            trendGranularity,
          ],

          limit: 100,

          /*
            Failed range probes are expected when checking
            what history the Vercel account exposes.
          */

          silentError: true,
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

      if (
        isAnalyticsNotEnabledError(
          error,
        )
      ) {
        throw error;
      }

      if (
        isRangeLimitError(
          error,
        ) &&
        !isLastCandidate
      ) {
        continue;
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

  throw (
    lastError ??
    new Error(
      "Unable to resolve analytics reporting range.",
    )
  );
}

/* =========================================================
   PREVIOUS PERIOD

   Uses the same exact duration as the current reporting
   window.

   Current:
   Aug 3 00:00 -> Aug 9 current time

   Previous:
   same duration immediately before Aug 3
   ========================================================= */

async function getPreviousCount({
  site,
  since,
  until,
}: {
  site: SiteRow;

  since: string;
  until: string;
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

        silentError: true,
      });

    return parseCount(
      raw,
    );
  } catch (
    error
  ) {
    /*
      Limited-history plans may not expose the full
      previous reporting period.
    */

    if (
      isRangeLimitError(
        error,
      )
    ) {
      return null;
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
   SAFE BREAKDOWN

   Vercel supports:

   time granularity + one extra dimension

   Examples:

   ["day", "requestPath"]
   ["day", "country"]
   ["day", "deviceType"]
   ["day", "referrerHostname"]

   parseDimension() merges the daily rows into final totals.
   ========================================================= */

async function safeAggregate({
  site,
  since,
  until,
  dimension,
  timeGranularity,
}: {
  site: SiteRow;

  since: string;
  until: string;

  dimension: string;

  timeGranularity:
    TimeGranularity;
}) {
  try {
    return await queryVercel({
      endpoint:
        "visits/aggregate",

      site,

      since,

      until,

      by: [
        timeGranularity,
        dimension,
      ],

      /*
        Because time + dimension can create many rows,
        use a larger limit and slice the final merged
        results later.
      */

      limit: 100,

      silentError: true,
    });
  } catch (
    error
  ) {
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

    /*
      A secondary breakdown should not break the complete
      analytics dashboard.
    */

    return {
      data: [],
    };
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
       VALIDATE ID
       ===================================================== */

    const parsedId =
      idSchema.safeParse(
        req.params.id,
      );

    if (
      !parsedId.success
    ) {
      res
        .status(400)
        .json({
          success: false,

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
       VALIDATE RANGE
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
        .status(400)
        .json({
          success: false,

          message: {
            en:
              "Invalid analytics range.",

            am:
              "የAnalytics ጊዜ ክልሉ ትክክል አይደለም።",
          },
        });

      return;
    }

    /* =====================================================
       GET SITE
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
      siteResult.rows[0];

    if (
      !site
    ) {
      res
        .status(404)
        .json({
          success: false,

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
       ANALYTICS DISABLED
       ===================================================== */

    if (
      !site.analytics_enabled
    ) {
      res.json({
        success: true,

        analytics: {
          available: false,

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
       PROJECT ID
       ===================================================== */

    if (
      !site.vercel_project_id
    ) {
      res.json({
        success: true,

        analytics: {
          available: false,

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
       ACCESS TOKEN
       ===================================================== */

    if (
      !process.env
        .VERCEL_ACCESS_TOKEN
        ?.trim()
    ) {
      res.json({
        success: true,

        analytics: {
          available: false,

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
       ANALYTICS
       ===================================================== */

    try {
      const range =
        parsedRange.data;

      const requestedDays =
        getRequestedDays(
          range,
        );

      /*
        IMPORTANT FIX:

        Do NOT convert this to startOfUtcDay().

        We need the actual current time for the end of the
        Vercel reporting window.
      */

      const now =
        new Date();

      /* ===================================================
         RESOLVE AVAILABLE RANGE
         =================================================== */

      const resolved =
        await resolveEffectiveRange({
          site,

          requestedDays,

          now,
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
         CURRENT TOTAL
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

         Use the exact duration of the current period.
         =================================================== */

      const currentPeriodDurationMs =
        Math.max(
          1,
          now.getTime() -
            sinceDate.getTime() +
            1,
        );

      const previousUntilDate =
        new Date(
          sinceDate.getTime() -
            1,
        );

      const previousSinceDate =
        new Date(
          previousUntilDate.getTime() -
            currentPeriodDurationMs +
            1,
        );

      const previous =
        await getPreviousCount({
          site,

          since:
            previousSinceDate.toISOString(),

          until:
            previousUntilDate.toISOString(),
        });

      /* ===================================================
         BREAKDOWNS

         Use the exact same current reporting window as the
         totals and trend.

         This is important because the old requests were
         ending too early.
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

            dimension:
              "requestPath",

            timeGranularity:
              trendGranularity,
          }),

          safeAggregate({
            site,

            since,

            until,

            dimension:
              "country",

            timeGranularity:
              trendGranularity,
          }),

          safeAggregate({
            site,

            since,

            until,

            dimension:
              "deviceType",

            timeGranularity:
              trendGranularity,
          }),

          safeAggregate({
            site,

            since,

            until,

            dimension:
              "referrerHostname",

            timeGranularity:
              trendGranularity,
          }),
        ]);

      /* ===================================================
         TRAFFIC TREND
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
        )
          .filter(
            (
              item,
            ) =>
              item.pageViews >
              0,
          )
          .slice(
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
        )
          .filter(
            (
              item,
            ) =>
              item.pageViews >
              0,
          )
          .slice(
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
          .filter(
            (
              item,
            ) =>
              item.pageViews >
              0,
          )
          .sort(
            (
              left,
              right,
            ) =>
              right.pageViews -
              left.pageViews,
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
        )
          .filter(
            (
              item,
            ) =>
              item.pageViews >
              0,
          )
          .slice(
            0,
            8,
          );

      /* ===================================================
         RESPONSE
         =================================================== */

      res.json({
        success: true,

        analytics: {
          available: true,

          /* ===============================================
             SELECTED RANGE
             =============================================== */

          range,

          requestedDays,

          /* ===============================================
             ACTUAL RANGE VERCEL ALLOWED
             =============================================== */

          effectiveDays,

          limited,

          limitedToDays:
            limited
              ? effectiveDays
              : null,

          trendGranularity,

          /*
            These now contain full ISO timestamps.

            Example:

            from:
            2026-08-03T00:00:00.000Z

            to:
            2026-08-09T11:57:00.000Z
          */

          from:
            since,

          to:
            until,

          comparisonAvailable:
            previous !== null,

          /* ===============================================
             TOTALS
             =============================================== */

          totals: {
            visitors:
              current.visitors,

            pageViews:
              current.pageViews,

            viewsPerVisitor:
              current.visitors > 0
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

          /* ===============================================
             DATA
             =============================================== */

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
          success: true,

          analytics: {
            available: false,

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
          error.status === 401 ||
          error.status === 403
        )
      ) {
        res
          .status(502)
          .json({
            success: false,

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
        .status(502)
        .json({
          success: false,

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