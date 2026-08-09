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

type PerformanceRange =
  | "7d"
  | "30d"
  | "90d";

type MetricName =
  | "LCP"
  | "INP"
  | "CLS";

type MetricRating =
  | "good"
  | "needs-improvement"
  | "poor";

type SiteRow = {
  id: string;
};

type MetricSummaryRow = {
  metric_name:
    MetricName;

  p75:
    number | string | null;

  sample_count:
    number | string;
};

type TrendRow = {
  date:
    string;

  lcp:
    number | string | null;

  inp:
    number | string | null;

  cls:
    number | string | null;
};

type SampleCountRow = {
  count:
    number | string;
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
    PerformanceRange,
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
  const next =
    new Date(
      date,
    );

  next.setUTCDate(
    next.getUTCDate() +
      days,
  );

  return next;
}

function toNumberOrNull(
  value:
    unknown,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const parsed =
    Number(
      value,
    );

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : null;
}

function roundMetric(
  name:
    MetricName,

  value:
    number | null,
) {
  if (
    value === null
  ) {
    return null;
  }

  if (
    name === "CLS"
  ) {
    return (
      Math.round(
        value * 1000,
      ) / 1000
    );
  }

  return Math.round(
    value,
  );
}

function getMetricRating(
  name:
    MetricName,

  value:
    number | null,
): MetricRating | null {
  if (
    value === null
  ) {
    return null;
  }

  switch (name) {
    case "LCP": {
      if (
        value <= 2500
      ) {
        return "good";
      }

      if (
        value <= 4000
      ) {
        return "needs-improvement";
      }

      return "poor";
    }

    case "INP": {
      if (
        value <= 200
      ) {
        return "good";
      }

      if (
        value <= 500
      ) {
        return "needs-improvement";
      }

      return "poor";
    }

    case "CLS": {
      if (
        value <= 0.1
      ) {
        return "good";
      }

      if (
        value <= 0.25
      ) {
        return "needs-improvement";
      }

      return "poor";
    }
  }
}

function clamp(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
) {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}

/*
  This is OUR custom dashboard score.

  It is NOT a Lighthouse score and is not presented as one.

  Good threshold       -> 100
  Poor threshold       -> 50
  2x poor threshold    -> 0
*/

function scoreMetric(
  value:
    number,

  good:
    number,

  poor:
    number,
) {
  if (
    value <= good
  ) {
    return 100;
  }

  if (
    value <= poor
  ) {
    const progress =
      (value - good) /
      (poor - good);

    return clamp(
      100 -
        progress *
          50,
      50,
      100,
    );
  }

  const maximum =
    poor * 2;

  if (
    value >= maximum
  ) {
    return 0;
  }

  const progress =
    (value - poor) /
      (maximum - poor);

  return clamp(
    50 -
      progress *
        50,
    0,
    50,
  );
}

function getPerformanceScore(
  lcp:
    number | null,

  inp:
    number | null,

  cls:
    number | null,
) {
  /*
    Do not invent a complete score when one of the three
    Core Web Vitals has not been measured yet.
  */

  if (
    lcp === null ||
    inp === null ||
    cls === null
  ) {
    return null;
  }

  const lcpScore =
    scoreMetric(
      lcp,
      2500,
      4000,
    );

  const inpScore =
    scoreMetric(
      inp,
      200,
      500,
    );

  const clsScore =
    scoreMetric(
      cls,
      0.1,
      0.25,
    );

  return Math.round(
    (
      lcpScore +
      inpScore +
      clsScore
    ) / 3,
  );
}

function createMetricSummary(
  rows:
    MetricSummaryRow[],

  name:
    MetricName,
) {
  const row =
    rows.find(
      (
        item,
      ) =>
        item.metric_name ===
        name,
    );

  const rawValue =
    toNumberOrNull(
      row?.p75,
    );

  const value =
    roundMetric(
      name,
      rawValue,
    );

  return {
    value,

    rating:
      getMetricRating(
        name,
        rawValue,
      ),

    samples:
      Number(
        row?.sample_count ??
          0,
      ),
  };
}

/* =========================================================
   AUTH
   ========================================================= */

router.use(
  requireAdmin,
);

/* =========================================================
   GET PERFORMANCE
   ========================================================= */

router.get(
  "/:id/performance",

  async (
    req,
    res,
  ) => {
    /* =====================================================
       SITE ID
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
              "Invalid performance range.",

            am:
              "የPerformance ጊዜ ክሉ ትክክል አይደለም።",
          },
        });

      return;
    }

    /* =====================================================
       SITE EXISTS
       ===================================================== */

    const siteResult =
      await db.query<SiteRow>(
        `
          SELECT
            id

          FROM monitored_sites

          WHERE id = $1

          LIMIT 1
        `,
        [
          parsedId.data,
        ],
      );

    if (
      !siteResult.rows[0]
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
       DATE WINDOW
       ===================================================== */

    const range =
      parsedRange.data;

    const days =
      getRangeDays(
        range,
      );

    const now =
      new Date();

    const currentDayStart =
      startOfUtcDay(
        now,
      );

    const since =
      addUtcDays(
        currentDayStart,
        -(
          days - 1
        ),
      );

    /* =====================================================
       OVERALL P75 METRICS
       ===================================================== */

    const summaryResult =
      await db.query<MetricSummaryRow>(
        `
          SELECT
            metric_name,

            PERCENTILE_CONT(0.75)
              WITHIN GROUP (
                ORDER BY metric_value
              ) AS p75,

            COUNT(*)::int AS sample_count

          FROM site_performance_metrics

          WHERE
            site_id = $1
            AND created_at >= $2
            AND created_at <= $3

          GROUP BY
            metric_name
        `,
        [
          parsedId.data,
          since,
          now,
        ],
      );

    /* =====================================================
       DAILY P75 TREND
       ===================================================== */

    const trendResult =
      await db.query<TrendRow>(
        `
          WITH daily_metrics AS (
            SELECT
              (
                created_at
                AT TIME ZONE 'UTC'
              )::date AS bucket_date,

              metric_name,

              PERCENTILE_CONT(0.75)
                WITHIN GROUP (
                  ORDER BY metric_value
                ) AS p75

            FROM site_performance_metrics

            WHERE
              site_id = $1
              AND created_at >= $2
              AND created_at <= $3

            GROUP BY
              (
                created_at
                AT TIME ZONE 'UTC'
              )::date,

              metric_name
          )

          SELECT
            TO_CHAR(
              bucket_date,
              'YYYY-MM-DD'
            ) AS date,

            MAX(p75)
              FILTER (
                WHERE metric_name = 'LCP'
              ) AS lcp,

            MAX(p75)
              FILTER (
                WHERE metric_name = 'INP'
              ) AS inp,

            MAX(p75)
              FILTER (
                WHERE metric_name = 'CLS'
              ) AS cls

          FROM daily_metrics

          GROUP BY
            bucket_date

          ORDER BY
            bucket_date ASC
        `,
        [
          parsedId.data,
          since,
          now,
        ],
      );

    /* =====================================================
       TOTAL METRIC SAMPLES
       ===================================================== */

    const sampleResult =
      await db.query<SampleCountRow>(
        `
          SELECT
            COUNT(*)::int AS count

          FROM site_performance_metrics

          WHERE
            site_id = $1
            AND created_at >= $2
            AND created_at <= $3
        `,
        [
          parsedId.data,
          since,
          now,
        ],
      );

    /* =====================================================
       SUMMARY
       ===================================================== */

    const lcp =
      createMetricSummary(
        summaryResult.rows,
        "LCP",
      );

    const inp =
      createMetricSummary(
        summaryResult.rows,
        "INP",
      );

    const cls =
      createMetricSummary(
        summaryResult.rows,
        "CLS",
      );

    const performanceScore =
      getPerformanceScore(
        lcp.value,
        inp.value,
        cls.value,
      );

    const metricSamples =
      Number(
        sampleResult.rows[0]
          ?.count ??
          0,
      );

    /* =====================================================
       TREND
       ===================================================== */

    const trend =
      trendResult.rows.map(
        (
          row,
        ) => {
          const rawLcp =
            toNumberOrNull(
              row.lcp,
            );

          const rawInp =
            toNumberOrNull(
              row.inp,
            );

          const rawCls =
            toNumberOrNull(
              row.cls,
            );

          const lcpValue =
            roundMetric(
              "LCP",
              rawLcp,
            );

          const inpValue =
            roundMetric(
              "INP",
              rawInp,
            );

          const clsValue =
            roundMetric(
              "CLS",
              rawCls,
            );

          return {
            date:
              row.date,

            lcp:
              lcpValue,

            inp:
              inpValue,

            cls:
              clsValue,

            performanceScore:
              getPerformanceScore(
                lcpValue,
                inpValue,
                clsValue,
              ),
          };
        },
      );

    /* =====================================================
       RESPONSE
       ===================================================== */

    res.json({
      success:
        true,

      performance: {
        available:
          true,

        hasData:
          metricSamples >
          0,

        range,

        from:
          since.toISOString(),

        to:
          now.toISOString(),

        totals: {
          lcp,

          inp,

          cls,

          performanceScore,

          metricSamples,
        },

        trend,
      },
    });
  },
);

export default router;