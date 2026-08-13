import {
  createHmac,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

import {
  Router,
  type Response,
} from "express";

import {
  z,
} from "zod";

import {
  db,
} from "../config/db.js";

import {
  env,
} from "../config/env.js";

import {
  rateLimit,
} from "../middleware/rate-limit.middleware.js";

import {
  requireRepresentative,
  requireRepresentativeReady,
} from "../middleware/representative-auth.middleware.js";

import {
  sendRepresentativeEmailChangedNotice,
  sendRepresentativeEmailVerificationCode,
} from "../services/application-email.service.js";

import {
  recordPartnerActivity,
} from "../services/partner-activity.service.js";

const router =
  Router();

const CODE_TTL_MINUTES =
  10;

const IDENTITY_TTL_MINUTES =
  30;

const RESEND_COOLDOWN_SECONDS =
  60;

const MAX_ATTEMPTS =
  5;

const sendLimiter =
  rateLimit({
    windowMs:
      15 *
      60 *
      1000,

    limit:
      5,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      success:
        false,

      code:
        "EMAIL_CHANGE_RATE_LIMITED",

      message: {
        en:
          "Too many verification-code requests. Please wait and try again.",

        am:
          "ብዙ የማረጋገጫ ኮድ ጥያቄዎች ተልከዋል። እባክዎ ቆይተው እንደገና ይሞክሩ።",
      },
    },
  });

const verifyLimiter =
  rateLimit({
    windowMs:
      15 *
      60 *
      1000,

    limit:
      20,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      success:
        false,

      code:
        "EMAIL_CHANGE_RATE_LIMITED",

      message: {
        en:
          "Too many verification attempts. Please wait and try again.",

        am:
          "ብዙ የማረጋገጫ ሙከራዎች ተደርገዋል። እባክዎ ቆይተው እንደገና ይሞክሩ።",
      },
    },
  });

const codeSchema =
  z
    .object({
      code:
        z
          .string()
          .regex(
            /^\d{4}$/,
          ),
    })
    .strict();

const newEmailSchema =
  z
    .object({
      email:
        z
          .email()
          .trim()
          .max(255),
    })
    .strict();

router.use(
  requireRepresentative,
  requireRepresentativeReady,
);

function normalizeEmail(
  value:
    string,
) {
  return value
    .trim()
    .toLowerCase();
}

function maskEmail(
  value:
    string,
) {
  const [
    local =
      "",
    domain =
      "",
  ] =
    value.split(
      "@",
    );

  const visible =
    local.charAt(
      0,
    ) ||
    "*";

  return `${visible}${"*".repeat(
    Math.max(
      3,
      Math.min(
        8,
        local.length -
          1,
      ),
    ),
  )}@${domain}`;
}

function createCode() {
  return String(
    randomInt(
      0,
      10_000,
    ),
  ).padStart(
    4,
    "0",
  );
}

function codeDigest(
  code:
    string,
) {
  return createHmac(
    "sha256",
    env.JWT_SECRET,
  )
    .update(
      `representative-email-code:${code}`,
    )
    .digest(
      "hex",
    );
}

function codeHash(
  challengeId:
    string,

  stage:
    "current" |
    "new",

  code:
    string,
) {
  return createHmac(
    "sha256",
    env.JWT_SECRET,
  )
    .update(
      `representative-email-change:${challengeId}:${stage}:${code}`,
    )
    .digest(
      "hex",
    );
}

function hashesMatch(
  actual:
    string,

  expected:
    string,
) {
  const actualBuffer =
    Buffer.from(
      actual,
      "hex",
    );

  const expectedBuffer =
    Buffer.from(
      expected,
      "hex",
    );

  return actualBuffer.length ===
    expectedBuffer.length &&
    timingSafeEqual(
      actualBuffer,
      expectedBuffer,
    );
}

function sendError(
  res:
    Response,

  status:
    number,

  code:
    string,

  en:
    string,

  am:
    string,
) {
  return res
    .status(
      status,
    )
    .json({
      success:
        false,

      code,

      message: {
        en,
        am,
      },
    });
}

router.post(
  "/current/send",

  sendLimiter,

  async (
    req,
    res,
    next,
  ) => {
    const client =
      await db.connect();

    let transactionOpen =
      false;

    try {
      await client.query(
        "BEGIN",
      );

      transactionOpen =
        true;

      const representativeResult =
        await client.query<{
          id:
            string;

          email:
            string;

          email_normalized:
            string;

          name:
            string;
        }>(
          `
            SELECT
              id,
              email,
              email_normalized,
              COALESCE(NULLIF(TRIM(display_name), ''), name) AS name
            FROM sales_representatives
            WHERE id = $1::uuid
            FOR UPDATE
          `,
          [
            req.auth!.id,
          ],
        );

      const representative =
        representativeResult.rows[0];

      if (
        !representative
      ) {
        await client.query(
          "ROLLBACK",
        );

        transactionOpen =
          false;

        sendError(
          res,
          404,
          "PARTNER_NOT_FOUND",
          "Partner account not found.",
          "የአጋር መለያው አልተገኘም።",
        );

        return;
      }

      const cooldownResult =
        await client.query<{
          retry_after:
            number;
        }>(
          `
            SELECT GREATEST(
              0,
              CEIL(
                EXTRACT(
                  EPOCH FROM (
                    current_code_last_sent_at
                    + INTERVAL '60 seconds'
                    - NOW()
                  )
                )
              )
            )::int AS retry_after
            FROM representative_email_change_challenges
            WHERE
              representative_id = $1::uuid
              AND completed_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
          `,
          [
            representative.id,
          ],
        );

      const retryAfter =
        Number(
          cooldownResult.rows[0]
            ?.retry_after ??
          0,
        );

      if (
        retryAfter >
        0
      ) {
        await client.query(
          "ROLLBACK",
        );

        transactionOpen =
          false;

        res.setHeader(
          "Retry-After",
          String(
            retryAfter,
          ),
        );

        sendError(
          res,
          429,
          "CODE_RESEND_COOLDOWN",
          `Wait ${retryAfter} seconds before requesting another code.`,
          `ሌላ ኮድ ከመጠየቅዎ በፊት ${retryAfter} ሰከንድ ይጠብቁ።`,
        );

        return;
      }

      await client.query(
        `
          UPDATE representative_email_change_challenges
          SET completed_at = NOW(), updated_at = NOW()
          WHERE representative_id = $1::uuid AND completed_at IS NULL
        `,
        [
          representative.id,
        ],
      );

      const challengeIdResult =
        await client.query<{
          id:
            string;
        }>(
          "SELECT gen_random_uuid() AS id",
        );

      const challengeId =
        challengeIdResult.rows[0]
          .id;

      const code =
        createCode();

      await client.query(
        `
          INSERT INTO representative_email_change_challenges (
            id,
            representative_id,
            current_email,
            current_email_normalized,
            current_code_hash,
            current_code_digest,
            current_code_expires_at
          )
          VALUES (
            $1::uuid,
            $2::uuid,
            $3::varchar,
            $4::varchar,
            $5::char(64),
            $6::char(64),
            NOW() + INTERVAL '10 minutes'
          )
        `,
        [
          challengeId,
          representative.id,
          representative.email,
          representative.email_normalized,
          codeHash(
            challengeId,
            "current",
            code,
          ),
          codeDigest(
            code,
          ),
        ],
      );

      await client.query(
        "COMMIT",
      );

      transactionOpen =
        false;

      const sent =
        await sendRepresentativeEmailVerificationCode({
          challengeId,
          stage:
            "current",
          email:
            representative.email,
          fullName:
            representative.name,
          code,
          sendVersion:
            Date.now(),
        });

      if (
        !sent
      ) {
        await db.query(
          `
            UPDATE representative_email_change_challenges
            SET completed_at = NOW(), updated_at = NOW()
            WHERE id = $1::uuid AND completed_at IS NULL
          `,
          [
            challengeId,
          ],
        );

        sendError(
          res,
          503,
          "VERIFICATION_EMAIL_FAILED",
          "The verification email could not be sent. Please try again.",
          "የማረጋገጫ ኢሜይሉን መላክ አልተቻለም። እንደገና ይሞክሩ።",
        );

        return;
      }

      await recordPartnerActivity({
        eventType:
          "partner.email_change_requested",

        actorType:
          "representative",

        representativeId:
          representative.id,

        metadata: {
          label:
            "Email change requested",

          challengeId,
        },
      });

      res.json({
        success:
          true,

        maskedEmail:
          maskEmail(
            representative.email,
          ),

        expiresInSeconds:
          CODE_TTL_MINUTES *
          60,

        resendAfterSeconds:
          RESEND_COOLDOWN_SECONDS,
      });
    } catch (
      error
    ) {
      if (
        transactionOpen
      ) {
        await client.query(
          "ROLLBACK",
        );
      }

      next(
        error,
      );
    } finally {
      client.release();
    }
  },
);

router.post(
  "/current/verify",

  verifyLimiter,

  async (
    req,
    res,
    next,
  ) => {
    const parsed =
      codeSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      sendError(
        res,
        400,
        "INVALID_CODE",
        "Enter the four-digit verification code.",
        "ባለአራት አሃዝ የማረጋገጫ ኮዱን ያስገቡ።",
      );

      return;
    }

    const client =
      await db.connect();

    try {
      await client.query(
        "BEGIN",
      );

      const result =
        await client.query(
          `
            SELECT *
            FROM representative_email_change_challenges
            WHERE
              representative_id = $1::uuid
              AND completed_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
            FOR UPDATE
          `,
          [
            req.auth!.id,
          ],
        );

      const challenge =
        result.rows[0];

      if (
        !challenge ||
        challenge.current_code_verified_at
      ) {
        await client.query(
          "ROLLBACK",
        );

        sendError(
          res,
          409,
          "CODE_NOT_AVAILABLE",
          "Request a new verification code to continue.",
          "ለመቀጠል አዲስ የማረጋገጫ ኮድ ይጠይቁ።",
        );

        return;
      }

      if (
        new Date(
          challenge.current_code_expires_at,
        ).getTime() <=
        Date.now()
      ) {
        await client.query(
          `
            UPDATE representative_email_change_challenges
            SET completed_at = NOW(), updated_at = NOW()
            WHERE id = $1::uuid
          `,
          [
            challenge.id,
          ],
        );

        await client.query(
          "COMMIT",
        );

        sendError(
          res,
          410,
          "CODE_EXPIRED",
          "This code has expired. Request a new code.",
          "ይህ ኮድ ጊዜው አልፏል። አዲስ ኮድ ይጠይቁ።",
        );

        return;
      }

      if (
        Number(
          challenge.current_code_attempts,
        ) >=
        MAX_ATTEMPTS
      ) {
        await client.query(
          "ROLLBACK",
        );

        sendError(
          res,
          429,
          "CODE_ATTEMPTS_EXCEEDED",
          "Too many incorrect attempts. Request a new code.",
          "ብዙ የተሳሳቱ ሙከራዎች ተደርገዋል። አዲስ ኮድ ይጠይቁ።",
        );

        return;
      }

      const matches =
        hashesMatch(
          codeHash(
            challenge.id,
            "current",
            parsed.data.code,
          ),
          String(
            challenge.current_code_hash,
          ),
        );

      if (
        !matches
      ) {
        const attempts =
          Math.min(
            MAX_ATTEMPTS,
            Number(
              challenge.current_code_attempts,
            ) +
              1,
          );

        await client.query(
          `
            UPDATE representative_email_change_challenges
            SET current_code_attempts = $2::int, updated_at = NOW()
            WHERE id = $1::uuid
          `,
          [
            challenge.id,
            attempts,
          ],
        );

        await client.query(
          "COMMIT",
        );

        sendError(
          res,
          attempts >=
            MAX_ATTEMPTS
            ? 429
            : 400,
          attempts >=
            MAX_ATTEMPTS
            ? "CODE_ATTEMPTS_EXCEEDED"
            : "INCORRECT_CODE",
          attempts >=
            MAX_ATTEMPTS
            ? "Too many incorrect attempts. Request a new code."
            : "Incorrect code. Try again.",
          attempts >=
            MAX_ATTEMPTS
            ? "ብዙ የተሳሳቱ ሙከራዎች ተደርገዋል። አዲስ ኮድ ይጠይቁ።"
            : "ኮዱ ትክክል አይደለም። እንደገና ይሞክሩ።",
        );

        return;
      }

      await client.query(
        `
          UPDATE representative_email_change_challenges
          SET current_code_verified_at = NOW(), updated_at = NOW()
          WHERE id = $1::uuid
        `,
        [
          challenge.id,
        ],
      );

      await client.query(
        "COMMIT",
      );

      res.json({
        success:
          true,

        currentEmailVerified:
          true,
      });
    } catch (
      error
    ) {
      await client.query(
        "ROLLBACK",
      );

      next(
        error,
      );
    } finally {
      client.release();
    }
  },
);

router.post(
  "/new/send",

  sendLimiter,

  async (
    req,
    res,
    next,
  ) => {
    const parsed =
      newEmailSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      sendError(
        res,
        400,
        "INVALID_EMAIL",
        "Enter a valid email address.",
        "ትክክለኛ የኢሜይል አድራሻ ያስገቡ።",
      );

      return;
    }

    const email =
      parsed.data.email.trim();

    const normalized =
      normalizeEmail(
        email,
      );

    const client =
      await db.connect();

    let transactionOpen =
      false;

    try {
      await client.query(
        "BEGIN",
      );

      transactionOpen =
        true;

      const result =
        await client.query(
          `
            SELECT
              challenge.*,
              representative.name,
              representative.display_name
            FROM representative_email_change_challenges challenge
            INNER JOIN sales_representatives representative
              ON representative.id = challenge.representative_id
            WHERE
              challenge.representative_id = $1::uuid
              AND challenge.completed_at IS NULL
            ORDER BY challenge.created_at DESC
            LIMIT 1
            FOR UPDATE OF challenge
          `,
          [
            req.auth!.id,
          ],
        );

      const challenge =
        result.rows[0];

      if (
        !challenge?.current_code_verified_at ||
        new Date(
          challenge.current_code_verified_at,
        ).getTime() <
          Date.now() -
            IDENTITY_TTL_MINUTES *
              60 *
              1000
      ) {
        await client.query(
          "ROLLBACK",
        );

        transactionOpen =
          false;

        sendError(
          res,
          403,
          "CURRENT_EMAIL_NOT_VERIFIED",
          "Verify your current email again before continuing.",
          "ከመቀጠልዎ በፊት የአሁኑን ኢሜይልዎን እንደገና ያረጋግጡ።",
        );

        return;
      }

      if (
        normalized ===
        challenge.current_email_normalized
      ) {
        await client.query(
          "ROLLBACK",
        );

        transactionOpen =
          false;

        sendError(
          res,
          409,
          "EMAIL_UNCHANGED",
          "Enter an email different from your current email.",
          "ከአሁኑ ኢሜይልዎ የተለየ ኢሜይል ያስገቡ።",
        );

        return;
      }

      const conflict =
        await client.query(
          `
            SELECT 1
            FROM sales_representatives
            WHERE
              email_normalized = $1::varchar
              AND id <> $2::uuid
            LIMIT 1
          `,
          [
            normalized,
            req.auth!.id,
          ],
        );

      if (
        conflict.rowCount
      ) {
        await client.query(
          "ROLLBACK",
        );

        transactionOpen =
          false;

        sendError(
          res,
          409,
          "EMAIL_UNAVAILABLE",
          "That email cannot be used for this account.",
          "ይህ ኢሜይል ለዚህ መለያ መጠቀም አይቻልም።",
        );

        return;
      }

      if (
        challenge.new_code_last_sent_at
      ) {
        const retryAfter =
          Math.max(
            0,
            Math.ceil(
              (
                new Date(
                  challenge.new_code_last_sent_at,
                ).getTime() +
                RESEND_COOLDOWN_SECONDS *
                  1000 -
                Date.now()
              ) /
                1000,
            ),
          );

        if (
          retryAfter >
          0
        ) {
          await client.query(
            "ROLLBACK",
          );

          transactionOpen =
            false;

          res.setHeader(
            "Retry-After",
            String(
              retryAfter,
            ),
          );

          sendError(
            res,
            429,
            "CODE_RESEND_COOLDOWN",
            `Wait ${retryAfter} seconds before requesting another code.`,
            `ሌላ ኮድ ከመጠየቅዎ በፊት ${retryAfter} ሰከንድ ይጠብቁ።`,
          );

          return;
        }
      }

      let code =
        createCode();

      while (
        codeDigest(
          code,
        ) ===
        String(
          challenge.current_code_digest,
        )
      ) {
        code =
          createCode();
      }

      await client.query(
        `
          UPDATE representative_email_change_challenges
          SET
            new_email = $2::varchar,
            new_email_normalized = $3::varchar,
            new_code_hash = $4::char(64),
            new_code_digest = $5::char(64),
            new_code_expires_at = NOW() + INTERVAL '10 minutes',
            new_code_attempts = 0,
            new_code_last_sent_at = NOW(),
            new_code_verified_at = NULL,
            updated_at = NOW()
          WHERE id = $1::uuid
        `,
        [
          challenge.id,
          email,
          normalized,
          codeHash(
            challenge.id,
            "new",
            code,
          ),
          codeDigest(
            code,
          ),
        ],
      );

      await client.query(
        "COMMIT",
      );

      transactionOpen =
        false;

      const sent =
        await sendRepresentativeEmailVerificationCode({
          challengeId:
            challenge.id,
          stage:
            "new",
          email,
          fullName:
            challenge.display_name ||
            challenge.name,
          code,
          sendVersion:
            Date.now(),
        });

      if (
        !sent
      ) {
        await db.query(
          `
            UPDATE representative_email_change_challenges
            SET
              new_email = NULL,
              new_email_normalized = NULL,
              new_code_hash = NULL,
              new_code_digest = NULL,
              new_code_expires_at = NULL,
              new_code_attempts = 0,
              new_code_last_sent_at = NULL,
              new_code_verified_at = NULL,
              updated_at = NOW()
            WHERE id = $1::uuid AND completed_at IS NULL
          `,
          [
            challenge.id,
          ],
        );

        sendError(
          res,
          503,
          "VERIFICATION_EMAIL_FAILED",
          "The verification email could not be sent. Please try again.",
          "የማረጋገጫ ኢሜይሉን መላክ አልተቻለም። እንደገና ይሞክሩ።",
        );

        return;
      }

      res.json({
        success:
          true,

        maskedEmail:
          maskEmail(
            email,
          ),

        expiresInSeconds:
          CODE_TTL_MINUTES *
          60,

        resendAfterSeconds:
          RESEND_COOLDOWN_SECONDS,
      });
    } catch (
      error
    ) {
      if (
        transactionOpen
      ) {
        await client.query(
          "ROLLBACK",
        );
      }

      next(
        error,
      );
    } finally {
      client.release();
    }
  },
);

router.post(
  "/new/verify",

  verifyLimiter,

  async (
    req,
    res,
    next,
  ) => {
    const parsed =
      codeSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      sendError(
        res,
        400,
        "INVALID_CODE",
        "Enter the four-digit verification code.",
        "ባለአራት አሃዝ የማረጋገጫ ኮዱን ያስገቡ።",
      );

      return;
    }

    const client =
      await db.connect();

    let committed =
      false;

    try {
      await client.query(
        "BEGIN",
      );

      const result =
        await client.query(
          `
            SELECT
              challenge.*,
              representative.name,
              representative.display_name
            FROM representative_email_change_challenges challenge
            INNER JOIN sales_representatives representative
              ON representative.id = challenge.representative_id
            WHERE
              challenge.representative_id = $1::uuid
              AND challenge.completed_at IS NULL
            ORDER BY challenge.created_at DESC
            LIMIT 1
            FOR UPDATE OF challenge, representative
          `,
          [
            req.auth!.id,
          ],
        );

      const challenge =
        result.rows[0];

      if (
        !challenge?.current_code_verified_at ||
        !challenge.new_code_hash ||
        !challenge.new_code_expires_at ||
        !challenge.new_email ||
        !challenge.new_email_normalized
      ) {
        await client.query(
          "ROLLBACK",
        );

        sendError(
          res,
          409,
          "CODE_NOT_AVAILABLE",
          "Request a new-email verification code to continue.",
          "ለመቀጠል የአዲሱን ኢሜይል ማረጋገጫ ኮድ ይጠይቁ።",
        );

        return;
      }

      const currentVerificationExpired =
        new Date(
          challenge.current_code_verified_at,
        ).getTime() <
        Date.now() -
          IDENTITY_TTL_MINUTES *
            60 *
            1000;

      const newCodeExpired =
        new Date(
          challenge.new_code_expires_at,
        ).getTime() <=
        Date.now();

      if (
        currentVerificationExpired ||
        newCodeExpired
      ) {
        await client.query(
          `
            UPDATE representative_email_change_challenges
            SET completed_at = NOW(), updated_at = NOW()
            WHERE id = $1::uuid
          `,
          [
            challenge.id,
          ],
        );

        await client.query(
          "COMMIT",
        );

        committed =
          true;

        sendError(
          res,
          410,
          "CODE_EXPIRED",
          "This verification has expired. Start again.",
          "ይህ ማረጋገጫ ጊዜው አልፏል። እንደገና ይጀምሩ።",
        );

        return;
      }

      if (
        Number(
          challenge.new_code_attempts,
        ) >=
        MAX_ATTEMPTS
      ) {
        await client.query(
          "ROLLBACK",
        );

        sendError(
          res,
          429,
          "CODE_ATTEMPTS_EXCEEDED",
          "Too many incorrect attempts. Request a new code.",
          "ብዙ የተሳሳቱ ሙከራዎች ተደርገዋል። አዲስ ኮድ ይጠይቁ።",
        );

        return;
      }

      const matches =
        hashesMatch(
          codeHash(
            challenge.id,
            "new",
            parsed.data.code,
          ),
          String(
            challenge.new_code_hash,
          ),
        );

      if (
        !matches
      ) {
        const attempts =
          Math.min(
            MAX_ATTEMPTS,
            Number(
              challenge.new_code_attempts,
            ) +
              1,
          );

        await client.query(
          `
            UPDATE representative_email_change_challenges
            SET new_code_attempts = $2::int, updated_at = NOW()
            WHERE id = $1::uuid
          `,
          [
            challenge.id,
            attempts,
          ],
        );

        await client.query(
          "COMMIT",
        );

        committed =
          true;

        sendError(
          res,
          attempts >=
            MAX_ATTEMPTS
            ? 429
            : 400,
          attempts >=
            MAX_ATTEMPTS
            ? "CODE_ATTEMPTS_EXCEEDED"
            : "INCORRECT_CODE",
          attempts >=
            MAX_ATTEMPTS
            ? "Too many incorrect attempts. Request a new code."
            : "Incorrect code. Try again.",
          attempts >=
            MAX_ATTEMPTS
            ? "ብዙ የተሳሳቱ ሙከራዎች ተደርገዋል። አዲስ ኮድ ይጠይቁ።"
            : "ኮዱ ትክክል አይደለም። እንደገና ይሞክሩ።",
        );

        return;
      }

      const conflict =
        await client.query(
          `
            SELECT 1
            FROM sales_representatives
            WHERE
              email_normalized = $1::varchar
              AND id <> $2::uuid
            LIMIT 1
          `,
          [
            challenge.new_email_normalized,
            req.auth!.id,
          ],
        );

      if (
        conflict.rowCount
      ) {
        await client.query(
          "ROLLBACK",
        );

        sendError(
          res,
          409,
          "EMAIL_UNAVAILABLE",
          "That email cannot be used for this account.",
          "ይህ ኢሜይል ለዚህ መለያ መጠቀም አይቻልም።",
        );

        return;
      }

      await client.query(
        `
          UPDATE sales_representatives
          SET
            email = $2::varchar,
            email_normalized = $3::varchar,
            updated_at = NOW()
          WHERE id = $1::uuid
        `,
        [
          req.auth!.id,
          challenge.new_email,
          challenge.new_email_normalized,
        ],
      );

      await client.query(
        `
          UPDATE representative_email_change_challenges
          SET
            new_code_verified_at = NOW(),
            completed_at = NOW(),
            updated_at = NOW()
          WHERE id = $1::uuid
        `,
        [
          challenge.id,
        ],
      );

      await client.query(
        "COMMIT",
      );

      committed =
        true;

      await recordPartnerActivity({
        eventType:
          "partner.email_changed",

        actorType:
          "representative",

        representativeId:
          req.auth!.id,

        metadata: {
          label:
            "Account email changed",

          challengeId:
            challenge.id,
        },
      });

      await sendRepresentativeEmailChangedNotice({
        challengeId:
          challenge.id,
        oldEmail:
          challenge.current_email,
        fullName:
          challenge.display_name ||
          challenge.name,
      });

      res.json({
        success:
          true,

        email:
          challenge.new_email,
      });
    } catch (
      error
    ) {
      if (
        !committed
      ) {
        await client.query(
          "ROLLBACK",
        );
      }

      if (
        (
          error as {
            code?:
              string;
          }
        ).code ===
        "23505"
      ) {
        sendError(
          res,
          409,
          "EMAIL_UNAVAILABLE",
          "That email cannot be used for this account.",
          "ይህ ኢሜይል ለዚህ መለያ መጠቀም አይቻልም።",
        );

        return;
      }

      next(
        error,
      );
    } finally {
      client.release();
    }
  },
);

export default router;
