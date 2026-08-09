import {
  createHash,
  timingSafeEqual,
} from "node:crypto";

import {
  Router,
} from "express";

import {
  rateLimit,
} from "express-rate-limit";

import {
  runAllMonitoredSiteHealthChecks,
} from "../services/site-health.service.js";

/* =========================================================
   ROUTER
   ========================================================= */

const router =
  Router();

/* =========================================================
   RATE LIMIT
   ========================================================= */

const runnerLimiter =
  rateLimit({
    windowMs:
      5 *
      60 *
      1000,

    limit:
      20,

    standardHeaders:
      true,

    legacyHeaders:
      false,
  });

/* =========================================================
   SECURE COMPARISON
   ========================================================= */

function hashSecret(
  value:
    string,
) {
  return createHash(
    "sha256",
  )
    .update(
      value,
      "utf8",
    )
    .digest();
}

function secretsMatch(
  provided:
    string,

  expected:
    string,
) {
  const providedHash =
    hashSecret(
      provided,
    );

  const expectedHash =
    hashSecret(
      expected,
    );

  return timingSafeEqual(
    providedHash,
    expectedHash,
  );
}

/* =========================================================
   RUN HEALTH CHECKS
   ========================================================= */

router.post(
  "/run",

  runnerLimiter,

  async (
    req,
    res,
  ) => {
    const expectedSecret =
      process.env
        .HEALTH_MONITOR_SECRET
        ?.trim();

    if (
      !expectedSecret
    ) {
      console.error(
        "HEALTH_MONITOR_SECRET is missing.",
      );

      res
        .status(503)
        .json({
          success:
            false,

          message:
            "Health monitor is not configured.",
        });

      return;
    }

    const providedSecret =
      req
        .header(
          "x-health-monitor-secret",
        )
        ?.trim();

    if (
      !providedSecret ||
      !secretsMatch(
        providedSecret,
        expectedSecret,
      )
    ) {
      res
        .status(401)
        .json({
          success:
            false,

          message:
            "Unauthorized.",
        });

      return;
    }

    try {
      const result =
        await runAllMonitoredSiteHealthChecks();

      res
        .status(200)
        .json({
          success:
            true,

          result,
        });
    } catch (
      error
    ) {
      console.error(
        "Health monitor runner error:",
        error,
      );

      res
        .status(500)
        .json({
          success:
            false,

          message:
            "Unable to execute site health checks.",
        });
    }
  },
);

export default router;