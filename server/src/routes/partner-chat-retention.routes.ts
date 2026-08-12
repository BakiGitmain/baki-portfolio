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
  deleteExpiredPartnerChatMessages,
} from "../services/partner-chat-retention.service.js";

import {
  env,
} from "../config/env.js";

const router =
  Router();

const runnerLimiter =
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

function digest(
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
    digest(
      provided,
    ),
    digest(
      expected,
    ),
  );
}

router.post(
  "/run",
  runnerLimiter,
  async (
    req,
    res,
  ) => {
    const expectedSecret =
      env.CHAT_RETENTION_SECRET
        ?.trim();

    if (
      !expectedSecret
    ) {
      console.error(
        "CHAT_RETENTION_SECRET is missing.",
      );

      res.status(503).json({
        success:
          false,

        message:
          "Partner Chat retention is not configured.",
      });

      return;
    }

    const providedSecret =
      req
        .header(
          "x-chat-retention-secret",
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
        await deleteExpiredPartnerChatMessages();

      console.info(
        "Partner Chat retention completed:",
        {
          deletedMessageCount:
            result.deletedMessageCount,

          skipped:
            result.skipped,
        },
      );

      res.json({
        success:
          true,

        result,
      });
    } catch (
      error
    ) {
      console.error(
        "Partner Chat retention failed:",
        error instanceof
          Error
          ? error.message
          : "Unknown retention error.",
      );

      res.status(500).json({
        success:
          false,

        message:
          "Unable to run Partner Chat retention.",
      });
    }
  },
);

export default router;
