import { Router } from "express";
import { rateLimit } from "../middleware/rate-limit.middleware.js";
import { z } from "zod";

import { db } from "../config/db.js";

/* =========================================================
   ROUTER
   ========================================================= */

const router = Router();

/* =========================================================
   TYPES
   ========================================================= */

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
  slug: string;
  frontend_url: string;
  monitoring_enabled: boolean;
};

/* =========================================================
   RATE LIMIT
   ========================================================= */

const performanceWriteLimiter =
  rateLimit({
    windowMs:
      60 * 1000,

    limit:
      180,

    standardHeaders:
      true,

    legacyHeaders:
      false,
  });

/* =========================================================
   VALIDATION
   ========================================================= */

const performanceMetricSchema =
  z.object({
    siteSlug:
      z
        .string()
        .trim()
        .min(2)
        .max(160)
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        ),

    name:
      z.enum([
        "LCP",
        "INP",
        "CLS",
      ]),

    value:
      z
        .number()
        .finite()
        .nonnegative()
        .max(120000),

    id:
      z
        .string()
        .trim()
        .min(1)
        .max(200),

    pathname:
      z
        .string()
        .trim()
        .min(1)
        .max(2000),

    origin:
      z
        .string()
        .trim()
        .url()
        .max(2000),
  });

/* =========================================================
   HELPERS
   ========================================================= */

function normalizeOrigin(
  value: string,
) {
  try {
    const url =
      new URL(value);

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

function getMetricRating(
  name: MetricName,
  value: number,
): MetricRating {
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

function getDeviceType(
  userAgent:
    string | undefined,
) {
  if (
    !userAgent
  ) {
    return "unknown";
  }

  if (
    /iPad|Tablet|PlayBook|Silk/i.test(
      userAgent,
    )
  ) {
    return "tablet";
  }

  if (
    /Mobi|Android|iPhone|iPod|Windows Phone/i.test(
      userAgent,
    )
  ) {
    return "mobile";
  }

  return "desktop";
}

/* =========================================================
   RECEIVE WEB VITAL
   ========================================================= */

router.post(
  "/vitals",

  performanceWriteLimiter,

  async (
    req,
    res,
  ) => {
    const parsed =
      performanceMetricSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      res
        .status(400)
        .json({
          success:
            false,

          message: {
            en:
              "Invalid performance metric.",

            am:
              "የPerformance metric መረጃው ትክክል አይደለም።",
          },
        });

      return;
    }

    const data =
      parsed.data;

    /* =====================================================
       FIND MONITORED SITE
       ===================================================== */

    const siteResult =
      await db.query<SiteRow>(
        `
          SELECT
            id,
            slug,
            frontend_url,
            monitoring_enabled

          FROM monitored_sites

          WHERE LOWER(slug) = LOWER($1)

          LIMIT 1
        `,
        [
          data.siteSlug,
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
              "Monitored site not found.",

            am:
              "የተመዘገበው site አልተገኘም።",
          },
        });

      return;
    }

    /* =====================================================
       MONITORING ENABLED
       ===================================================== */

    if (
      !site.monitoring_enabled
    ) {
      res
        .status(202)
        .json({
          success:
            true,

          stored:
            false,
        });

      return;
    }

    /* =====================================================
       VERIFY ORIGIN

       Performance data is accepted only from the actual
       frontend URL stored for this monitored site.
       ===================================================== */

    const registeredOrigin =
      normalizeOrigin(
        site.frontend_url,
      );

    const payloadOrigin =
      normalizeOrigin(
        data.origin,
      );

    const requestOriginHeader =
      typeof req.headers.origin ===
        "string"
        ? req.headers.origin
        : null;

    const requestOrigin =
      requestOriginHeader
        ? normalizeOrigin(
            requestOriginHeader,
          )
        : null;

    if (
      !registeredOrigin ||
      !payloadOrigin
    ) {
      res
        .status(400)
        .json({
          success:
            false,

          message: {
            en:
              "Invalid site origin.",

            am:
              "የSite origin ትክክል አይደለም።",
          },
        });

      return;
    }

    if (
      requestOrigin &&
      requestOrigin !==
        payloadOrigin
    ) {
      res
        .status(403)
        .json({
          success:
            false,

          message: {
            en:
              "Performance origin mismatch.",

            am:
              "የPerformance origin አይዛመድም።",
          },
        });

      return;
    }

    const isDevelopment =
  process.env.NODE_ENV !==
  "production";

const isLocalOrigin =
  payloadOrigin ===
    "http://localhost:3000" ||
  payloadOrigin ===
    "http://127.0.0.1:3000";

if (
  payloadOrigin !==
    registeredOrigin &&
  !(
    isDevelopment &&
    isLocalOrigin
  )
) {
  res
    .status(403)
    .json({
      success:
        false,

      message: {
        en:
          "Performance data was sent from an unregistered origin.",

        am:
          "Performance data ከተመዘገበው site origin አልመጣም።",
      },
    });

  return;
}

    /* =====================================================
       RATING
       ===================================================== */

    const rating =
      getMetricRating(
        data.name,
        data.value,
      );

    const deviceType =
      getDeviceType(
        req.headers[
          "user-agent"
        ],
      );

    /* =====================================================
       STORE

       ON CONFLICT protects against the same Web Vital being
       reported more than once.

       If the browser sends an updated value with the same
       metric ID, we update the existing record.
       ===================================================== */

    await db.query(
      `
        INSERT INTO site_performance_metrics (
          site_id,
          metric_name,
          metric_value,
          metric_id,
          rating,
          pathname,
          device_type
        )

        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )

        ON CONFLICT (
          site_id,
          metric_name,
          metric_id
        )

        DO UPDATE SET
          metric_value =
            EXCLUDED.metric_value,

          rating =
            EXCLUDED.rating,

          pathname =
            EXCLUDED.pathname,

          device_type =
            EXCLUDED.device_type
      `,
      [
        site.id,
        data.name,
        data.value,
        data.id,
        rating,
        data.pathname,
        deviceType,
      ],
    );

    res
      .status(202)
      .json({
        success:
          true,

        stored:
          true,
      });
  },
);

export default router;
