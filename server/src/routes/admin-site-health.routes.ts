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

type HealthRange =
  | "7d"
  | "30d"
  | "90d";

type HealthTarget =
  | "frontend"
  | "backend";

type HealthStatus =
  | "online"
  | "offline"
  | "not_checked"
  | "not_configured";

type SiteRow = {
  id:
    string;

  frontend_url:
    string;

  backend_url:
    string | null;

  health_url:
    string | null;

  monitoring_enabled:
    boolean;
};

type LatestHealthRow = {
  target:
    HealthTarget;

  online:
    boolean;

  status_code:
    number | null;

  response_ms:
    number | null;

  error_message:
    string | null;

  checked_at:
    Date | string;
};

type SummaryRow = {
  frontend_response_ms:
    number | string | null;

  backend_response_ms:
    number | string | null;
};

type UptimeRow = {
  total_runs:
    number | string;

  successful_runs:
    number | string;

  uptime:
    number | string | null;
};

type IncidentRow = {
  incident_count:
    number | string;
};

type CheckCountRow = {
  check_count:
    number | string;
};

type TrendRow = {
  date:
    string;

  frontend_response_ms:
    number | string | null;

  backend_response_ms:
    number | string | null;

  uptime:
    number | string | null;
};

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
   HELPERS
   ========================================================= */

function getRangeDays(
  range:
    HealthRange,
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

function toNumberOrNull(
  value:
    unknown,
) {
  if (
    value ===
      null ||
    value ===
      undefined
  ) {
    return null;
  }

  const parsed =
    Number(
      value,
    );

  if (
    !Number.isFinite(
      parsed,
    )
  ) {
    return null;
  }

  return parsed;
}

function roundMilliseconds(
  value:
    unknown,
) {
  const number =
    toNumberOrNull(
      value,
    );

  if (
    number ===
    null
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.round(
      number,
    ),
  );
}

function roundUptime(
  value:
    unknown,
) {
  const number =
    toNumberOrNull(
      value,
    );

  if (
    number ===
    null
  ) {
    return null;
  }

  return (
    Math.round(
      number *
        100,
    ) /
    100
  );
}

function getCurrentStatus({
  configured,
  row,
}: {
  configured:
    boolean;

  row:
    LatestHealthRow | undefined;
}) {
  if (
    !configured
  ) {
    return {
      configured:
        false,

      status:
        "not_configured" as HealthStatus,

      online:
        null,

      statusCode:
        null,

      responseMs:
        null,

      errorMessage:
        null,

      checkedAt:
        null,
    };
  }

  if (
    !row
  ) {
    return {
      configured:
        true,

      status:
        "not_checked" as HealthStatus,

      online:
        null,

      statusCode:
        null,

      responseMs:
        null,

      errorMessage:
        null,

      checkedAt:
        null,
    };
  }

  return {
    configured:
      true,

    status:
      (
        row.online
          ? "online"
          : "offline"
      ) as HealthStatus,

    online:
      row.online,

    statusCode:
      row.status_code,

    responseMs:
      row.response_ms,

    errorMessage:
      row.error_message,

    checkedAt:
      new Date(
        row.checked_at,
      ).toISOString(),
  };
}

/* =========================================================
   AUTH
   ========================================================= */

router.use(
  requireAdmin,
);

/* =========================================================
   GET HEALTH
   ========================================================= */

router.get(
  "/:id/health",

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
        .status(400)
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
        .status(400)
        .json({
          success:
            false,

          message: {
            en:
              "Invalid health range.",

            am:
              "የHealth monitoring ጊዜ ክሉ ትክክል አይደለም።",
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
            frontend_url,
            backend_url,
            health_url,
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
       PERIOD
       ===================================================== */

    const range =
      parsedRange.data;

    const days =
      getRangeDays(
        range,
      );

    const now =
      new Date();

    const today =
      startOfUtcDay(
        now,
      );

    const since =
      addUtcDays(
        today,
        -(
          days -
          1
        ),
      );

    /* =====================================================
       LATEST CHECKS
       ===================================================== */

    const latestResult =
      await db.query<LatestHealthRow>(
        `
          SELECT DISTINCT ON (
            target
          )
            target,
            online,
            status_code,
            response_ms,
            error_message,
            checked_at

          FROM site_health_checks

          WHERE site_id = $1

          ORDER BY
            target,
            checked_at DESC,
            id DESC
        `,
        [
          parsedId.data,
        ],
      );

    /* =====================================================
       P75 RESPONSE TIMES
       ===================================================== */

    const summaryResult =
      await db.query<SummaryRow>(
        `
          SELECT
            PERCENTILE_CONT(0.75)
              WITHIN GROUP (
                ORDER BY response_ms
              )
              FILTER (
                WHERE
                  target = 'frontend'
                  AND online = TRUE
                  AND response_ms IS NOT NULL
              )
              AS frontend_response_ms,

            PERCENTILE_CONT(0.75)
              WITHIN GROUP (
                ORDER BY response_ms
              )
              FILTER (
                WHERE
                  target = 'backend'
                  AND online = TRUE
                  AND response_ms IS NOT NULL
              )
              AS backend_response_ms

          FROM site_health_checks

          WHERE
            site_id = $1
            AND checked_at >= $2
            AND checked_at <= $3
        `,
        [
          parsedId.data,
          since,
          now,
        ],
      );

    /* =====================================================
       OVERALL UPTIME

       Each run gets one final status.

       If both frontend + backend were checked, both must
       succeed for that monitoring run to count as online.

       If only frontend is configured, frontend determines
       the run status.
       ===================================================== */

    const uptimeResult =
      await db.query<UptimeRow>(
        `
          WITH runs AS (
            SELECT
              run_id,

              BOOL_AND(
                online
              ) AS run_online

            FROM site_health_checks

            WHERE
              site_id = $1
              AND checked_at >= $2
              AND checked_at <= $3

            GROUP BY
              run_id
          )

          SELECT
            COUNT(*)::int
              AS total_runs,

            COUNT(*)
              FILTER (
                WHERE run_online = TRUE
              )::int
              AS successful_runs,

            CASE
              WHEN COUNT(*) = 0
                THEN NULL

              ELSE ROUND(
                (
                  COUNT(*)
                    FILTER (
                      WHERE run_online = TRUE
                    )::numeric
                  /
                  COUNT(*)::numeric
                ) *
                100,
                2
              )
            END AS uptime

          FROM runs
        `,
        [
          parsedId.data,
          since,
          now,
        ],
      );

    /* =====================================================
       INCIDENTS

       Incident =
       target changes from online -> offline.

       The window function sees ALL historical rows first,
       then we count transitions inside the selected range.
       ===================================================== */

    const incidentResult =
      await db.query<IncidentRow>(
        `
          WITH ordered_checks AS (
            SELECT
              id,
              target,
              online,
              checked_at,

              LAG(
                online
              ) OVER (
                PARTITION BY target

                ORDER BY
                  checked_at ASC,
                  id ASC
              )
                AS previous_online

            FROM site_health_checks

            WHERE site_id = $1
          ),

          period_checks AS (
            SELECT
              *

            FROM ordered_checks

            WHERE
              checked_at >= $2
              AND checked_at <= $3
          )

          SELECT
            COUNT(*)::int
              AS incident_count

          FROM period_checks

          WHERE
            online = FALSE
            AND COALESCE(
              previous_online,
              TRUE
            ) = TRUE
        `,
        [
          parsedId.data,
          since,
          now,
        ],
      );

    /* =====================================================
       CHECK COUNT
       ===================================================== */

    const checkCountResult =
      await db.query<CheckCountRow>(
        `
          SELECT
            COUNT(*)::int
              AS check_count

          FROM site_health_checks

          WHERE
            site_id = $1
            AND checked_at >= $2
            AND checked_at <= $3
        `,
        [
          parsedId.data,
          since,
          now,
        ],
      );

    /* =====================================================
       DAILY TREND
       ===================================================== */

    const trendResult =
      await db.query<TrendRow>(
        `
          WITH base AS (
            SELECT
              (
                checked_at
                AT TIME ZONE 'UTC'
              )::date
                AS bucket_date,

              run_id,

              target,

              online,

              response_ms

            FROM site_health_checks

            WHERE
              site_id = $1
              AND checked_at >= $2
              AND checked_at <= $3
          ),

          daily_response AS (
            SELECT
              bucket_date,

              PERCENTILE_CONT(0.75)
                WITHIN GROUP (
                  ORDER BY response_ms
                )
                FILTER (
                  WHERE
                    target = 'frontend'
                    AND online = TRUE
                    AND response_ms IS NOT NULL
                )
                AS frontend_response_ms,

              PERCENTILE_CONT(0.75)
                WITHIN GROUP (
                  ORDER BY response_ms
                )
                FILTER (
                  WHERE
                    target = 'backend'
                    AND online = TRUE
                    AND response_ms IS NOT NULL
                )
                AS backend_response_ms

            FROM base

            GROUP BY
              bucket_date
          ),

          runs AS (
            SELECT
              bucket_date,
              run_id,

              BOOL_AND(
                online
              ) AS run_online

            FROM base

            GROUP BY
              bucket_date,
              run_id
          ),

          daily_uptime AS (
            SELECT
              bucket_date,

              CASE
                WHEN COUNT(*) = 0
                  THEN NULL

                ELSE ROUND(
                  (
                    COUNT(*)
                      FILTER (
                        WHERE run_online = TRUE
                      )::numeric
                    /
                    COUNT(*)::numeric
                  ) *
                  100,
                  2
                )
              END AS uptime

            FROM runs

            GROUP BY
              bucket_date
          )

          SELECT
            TO_CHAR(
              COALESCE(
                daily_response.bucket_date,
                daily_uptime.bucket_date
              ),
              'YYYY-MM-DD'
            )
              AS date,

            daily_response.frontend_response_ms,

            daily_response.backend_response_ms,

            daily_uptime.uptime

          FROM daily_response

          FULL OUTER JOIN daily_uptime
            ON daily_response.bucket_date =
               daily_uptime.bucket_date

          ORDER BY
            COALESCE(
              daily_response.bucket_date,
              daily_uptime.bucket_date
            )
              ASC
        `,
        [
          parsedId.data,
          since,
          now,
        ],
      );

    /* =====================================================
       NORMALIZE
       ===================================================== */

    const frontendLatest =
      latestResult.rows.find(
        (
          row,
        ) =>
          row.target ===
          "frontend",
      );

    const backendLatest =
      latestResult.rows.find(
        (
          row,
        ) =>
          row.target ===
          "backend",
      );

    const backendConfigured =
      Boolean(
        site.health_url ||
        site.backend_url,
      );

    const summary =
      summaryResult.rows[0];

    const uptimeSummary =
      uptimeResult.rows[0];

    const incidents =
      Number(
        incidentResult.rows[0]
          ?.incident_count ??
          0,
      );

    const checkCount =
      Number(
        checkCountResult.rows[0]
          ?.check_count ??
          0,
      );

    const trend =
      trendResult.rows.map(
        (
          row,
        ) => ({
          date:
            row.date,

          frontendResponseMs:
            roundMilliseconds(
              row.frontend_response_ms,
            ),

          backendResponseMs:
            roundMilliseconds(
              row.backend_response_ms,
            ),

          uptime:
            roundUptime(
              row.uptime,
            ),
        }),
      );

    /* =====================================================
       RESPONSE
       ===================================================== */

    res.json({
      success:
        true,

      health: {
        available:
          true,

        hasData:
          checkCount >
          0,

        range,

        from:
          since.toISOString(),

        to:
          now.toISOString(),

        monitoringEnabled:
          site.monitoring_enabled,

        totals: {
          frontendResponseMs:
            roundMilliseconds(
              summary
                ?.frontend_response_ms,
            ),

          backendResponseMs:
            roundMilliseconds(
              summary
                ?.backend_response_ms,
            ),

          uptime:
            roundUptime(
              uptimeSummary
                ?.uptime,
            ),

          incidents,

          checks:
            checkCount,

          monitoringRuns:
            Number(
              uptimeSummary
                ?.total_runs ??
                0,
            ),
        },

        current: {
          frontend:
            getCurrentStatus({
              configured:
                true,

              row:
                frontendLatest,
            }),

          backend:
            getCurrentStatus({
              configured:
                backendConfigured,

              row:
                backendLatest,
            }),
        },

        trend,
      },
    });
  },
);

export default router;