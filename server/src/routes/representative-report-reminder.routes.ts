import {
  createHash,
  timingSafeEqual,
} from "node:crypto";

import {
  Router,
} from "express";

import {
  rateLimit,
} from "../middleware/rate-limit.middleware.js";

import {
  runRepresentativeReportReminders,
} from "../services/representative-report-reminder.service.js";

const router =
  Router();

const runnerRateLimit =
  rateLimit({
    windowMs:
      60 *
      60 *
      1000,

    limit:
      10,

    standardHeaders:
      true,

    legacyHeaders:
      false,
  });

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
  return timingSafeEqual(
    hashSecret(
      provided,
    ),

    hashSecret(
      expected,
    ),
  );
}

router.post(
  "/run",

  runnerRateLimit,

  async (
    req,
    res,
  ) => {
    const expectedSecret =
      process.env
        .REPORT_REMINDER_SECRET
        ?.trim();

    if (
      !expectedSecret
    ) {
      console.error(
        "REPORT_REMINDER_SECRET is missing.",
      );

      res.status(503).json({
        success:
          false,

        message:
          "Representative report reminders are not configured.",
      });

      return;
    }

    const providedSecret =
      req
        .header(
          "x-report-reminder-secret",
        )
        ?.trim();

    if (
      !providedSecret ||
      !secretsMatch(
        providedSecret,
        expectedSecret,
      )
    ) {
      res.status(401).json({
        success:
          false,

        message:
          "Unauthorized.",
      });

      return;
    }

    try {
      const result =
        await runRepresentativeReportReminders();

      res.json({
        success:
          true,

        result,
      });
    } catch (
      error
    ) {
      console.error(
        "Representative report reminder runner error:",
        error instanceof Error
          ? error.message
          : "Unknown reminder runner error.",
      );

      res.status(500).json({
        success:
          false,

        message:
          "Unable to run representative report reminders.",
      });
    }
  },
);

export default router;
