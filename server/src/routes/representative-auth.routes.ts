import {
  Router,
  type CookieOptions,
} from "express";

import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";

import {
  rateLimit,
} from "express-rate-limit";

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
  requireRepresentative,
} from "../middleware/representative-auth.middleware.js";

/* =========================================================
   ROUTER
   ========================================================= */

const router =
  Router();

/* =========================================================
   SESSION
   ========================================================= */

const SESSION_MAX_AGE =
  7 *
  24 *
  60 *
  60 *
  1000;

const SESSION_EXPIRES_IN =
  "7d" as const;

/* =========================================================
   COOKIE
   ========================================================= */

function getCookieOptions():
  CookieOptions {
  const production =
    env.NODE_ENV ===
    "production";

  return {
    httpOnly:
      true,

    secure:
      production,

    sameSite:
      "lax",

    path:
      "/",

    maxAge:
      SESSION_MAX_AGE,
  };
}

/* =========================================================
   JWT
   ========================================================= */

function createToken(
  representative: {
    id:
      string;

    username:
      string;

    sessionVersion:
      number;
  },
) {
  return jwt.sign(
    {
      role:
        "representative",

      username:
        representative
          .username,

      sessionVersion:
        representative
          .sessionVersion,
    },

    env.JWT_SECRET,

    {
      algorithm:
        "HS256",

      subject:
        String(
          representative.id,
        ),

      expiresIn:
        SESSION_EXPIRES_IN,
    },
  );
}

/* =========================================================
   RATE LIMIT
   ========================================================= */

const loginLimiter =
  rateLimit({
    windowMs:
      15 *
      60 *
      1000,

    limit:
      10,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    skipSuccessfulRequests:
      true,

    message: {
      success:
        false,

      message: {
        en:
          "Too many login attempts. Try again later.",

        am:
          "በጣም ብዙ login ሙከራዎች ተደርገዋል። ቆይተው ይሞክሩ።",
      },
    },
  });

/* =========================================================
   VALIDATION
   ========================================================= */

const loginSchema =
  z.object({
    username:
      z
        .string()
        .trim()
        .min(1)
        .max(32),

    password:
      z
        .string()
        .min(1)
        .max(128),
  });

/*
  Simple password rule:

  - minimum 6 characters
  - maximum 128
  - letters, numbers, symbols — anything is okay
*/

const changePasswordSchema =
  z.object({
    currentPassword:
      z
        .string()
        .max(128)
        .optional(),

    newPassword:
      z
        .string()
        .min(6)
        .max(128),
  });

/* =========================================================
   LOGIN
   ========================================================= */

router.post(
  "/login",

  loginLimiter,

  async (
    req,
    res,
    next,
  ) => {
    try {
      const parsed =
        loginSchema.safeParse(
          req.body,
        );

      if (
        !parsed.success
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
                "Invalid login information.",

              am:
                "የLogin መረጃው ትክክል አይደለም።",
            },
          });

        return;
      }

      const {
        username,
        password,
      } =
        parsed.data;

      const result =
        await db.query(
          `
            SELECT
              id,
              username,
              name,
              email,
              password_hash,
              is_active,
              must_change_password,
              failed_login_attempts,
              locked_until,
              session_version
            FROM sales_representatives
            WHERE
              LOWER(username) =
              LOWER($1)
            LIMIT 1
          `,
          [
            username,
          ],
        );

      const representative =
        result.rows[0];

      /* ===================================================
         GENERIC LOGIN ERROR
         =================================================== */

      if (
        !representative
      ) {
        res
          .status(
            401,
          )
          .json({
            success:
              false,

            message: {
              en:
                "Invalid username or password.",

              am:
                "Username ወይም password ትክክል አይደለም።",
            },
          });

        return;
      }

      /* ===================================================
         ACTIVE
         =================================================== */

      if (
        !representative
          .is_active
      ) {
        res
          .status(
            403,
          )
          .json({
            success:
              false,

            message: {
              en:
                "This representative account is disabled.",

              am:
                "ይህ Representative account disabled ነው።",
            },
          });

        return;
      }

      /* ===================================================
         LOCKED
         =================================================== */

      if (
        representative
          .locked_until &&
        new Date(
          representative
            .locked_until,
        ).getTime() >
          Date.now()
      ) {
        res
          .status(
            429,
          )
          .json({
            success:
              false,

            message: {
              en:
                "Too many failed login attempts. Try again later.",

              am:
                "ብዙ የተሳሳቱ login ሙከራዎች ተደርገዋል። ቆይተው ይሞክሩ።",
            },
          });

        return;
      }

      /* ===================================================
         PASSWORD
         =================================================== */

      const passwordMatches =
        await bcrypt.compare(
          password,

          representative
            .password_hash,
        );

      if (
        !passwordMatches
      ) {
        const attempts =
          Number(
            representative
              .failed_login_attempts ??
              0,
          ) +
          1;

        const shouldLock =
          attempts >=
          5;

        await db.query(
          `
            UPDATE sales_representatives
            SET
              failed_login_attempts = $1,

              locked_until =
                CASE
                  WHEN $2 = TRUE
                  THEN NOW() + INTERVAL '15 minutes'
                  ELSE NULL
                END,

              updated_at = NOW()
            WHERE id = $3
          `,
          [
            shouldLock
              ? 0
              : attempts,

            shouldLock,

            representative.id,
          ],
        );

        res
          .status(
            shouldLock
              ? 429
              : 401,
          )
          .json({
            success:
              false,

            message: {
              en:
                shouldLock
                  ? "Too many failed login attempts. Try again later."
                  : "Invalid username or password.",

              am:
                shouldLock
                  ? "ብዙ የተሳሳቱ login ሙከራዎች ተደርገዋል። ቆይተው ይሞክሩ።"
                  : "Username ወይም password ትክክል አይደለም።",
            },
          });

        return;
      }

      /* ===================================================
         SUCCESS
         =================================================== */

      await db.query(
        `
          UPDATE sales_representatives
          SET
            failed_login_attempts = 0,
            locked_until = NULL,
            last_login_at = NOW(),
            updated_at = NOW()
          WHERE id = $1
        `,
        [
          representative.id,
        ],
      );

      const sessionVersion =
        Number(
          representative
            .session_version,
        );

      const token =
        createToken({
          id:
            representative.id,

          username:
            representative.username,

          sessionVersion,
        });

      res.cookie(
        env
          .REP_JWT_COOKIE_NAME,

        token,

        getCookieOptions(),
      );

      const mustChangePassword =
        Boolean(
          representative
            .must_change_password,
        );

      res.json({
        success:
          true,

        user: {
          id:
            representative.id,

          username:
            representative.username,

          name:
            representative.name,

          email:
            representative.email,

          role:
            "representative",

          mustChangePassword,
        },

        redirectTo:
          mustChangePassword
            ? "/representative/change-password"
            : "/representative/dashboard",
      });
    } catch (
      error
    ) {
      next(
        error,
      );
    }
  },
);

/* =========================================================
   CURRENT REPRESENTATIVE
   ========================================================= */

router.get(
  "/me",

  requireRepresentative,

  (
    req,
    res,
  ) => {
    res.json({
      success:
        true,

      user:
        req.auth,
    });
  },
);

/* =========================================================
   CHANGE PASSWORD
   ========================================================= */

router.post(
  "/change-password",

  requireRepresentative,

  async (
    req,
    res,
    next,
  ) => {
    try {
      const parsed =
        changePasswordSchema
          .safeParse(
            req.body,
          );

      if (
        !parsed.success
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
                "Password must be at least 6 characters.",

              am:
                "Password ቢያንስ 6 characters ሊሆን ይገባል።",
            },
          });

        return;
      }

      const representativeId =
        req.auth?.id;

      if (
        !representativeId
      ) {
        res
          .status(
            401,
          )
          .json({
            success:
              false,

            message: {
              en:
                "Authentication required.",

              am:
                "Login ያስፈልጋል።",
            },
          });

        return;
      }

      const {
        currentPassword,
        newPassword,
      } =
        parsed.data;

      /* ===================================================
         LOAD ACCOUNT
         =================================================== */

      const result =
        await db.query(
          `
            SELECT
              id,
              username,
              password_hash,
              must_change_password,
              session_version
            FROM sales_representatives
            WHERE id = $1
            LIMIT 1
          `,
          [
            representativeId,
          ],
        );

      const representative =
        result.rows[0];

      if (
        !representative
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
                "Representative account not found.",

              am:
                "Representative account አልተገኘም።",
            },
          });

        return;
      }

      const firstTimeSetup =
        Boolean(
          representative
            .must_change_password,
        );

      /* ===================================================
         NORMAL PASSWORD CHANGE

         First login:
         - NO current password required.

         Later:
         - Current password required.
         =================================================== */

      if (
        !firstTimeSetup
      ) {
        if (
          !currentPassword
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
                  "Enter your current password.",

                am:
                  "Current passwordዎን ያስገቡ።",
              },
            });

          return;
        }

        const currentMatches =
          await bcrypt.compare(
            currentPassword,

            representative
              .password_hash,
          );

        if (
          !currentMatches
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
                  "Current password is incorrect.",

                am:
                  "Current password ትክክል አይደለም።",
              },
            });

          return;
        }
      }

      /* ===================================================
         DON'T KEEP SAME PASSWORD

         This prevents first-time users from simply setting
         their password back to 1234.
         =================================================== */

      const samePassword =
        await bcrypt.compare(
          newPassword,

          representative
            .password_hash,
        );

      if (
        samePassword
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
                "Choose a different password.",

              am:
                "የተለየ password ይምረጡ።",
            },
          });

        return;
      }

      /* ===================================================
         HASH NEW PASSWORD
         =================================================== */

      const passwordHash =
        await bcrypt.hash(
          newPassword,
          12,
        );

      /* ===================================================
         UPDATE
         =================================================== */

      const updateResult =
        await db.query(
          `
            UPDATE sales_representatives
            SET
              password_hash = $1,

              must_change_password = FALSE,

              password_changed_at = NOW(),

              session_version =
                session_version + 1,

              updated_at = NOW()
            WHERE id = $2
            RETURNING
              username,
              session_version
          `,
          [
            passwordHash,
            representativeId,
          ],
        );

      const updated =
        updateResult.rows[0];

      /* ===================================================
         ISSUE NEW SESSION

         Old representative sessions become invalid because
         session_version was incremented.
         =================================================== */

      const token =
        createToken({
          id:
            representativeId,

          username:
            updated.username,

          sessionVersion:
            Number(
              updated
                .session_version,
            ),
        });

      res.cookie(
        env
          .REP_JWT_COOKIE_NAME,

        token,

        getCookieOptions(),
      );

      res.json({
        success:
          true,

        redirectTo:
          "/representative/dashboard",

        message: {
          en:
            "Password changed successfully.",

          am:
            "Password በተሳካ ሁኔታ ተቀይሯል።",
        },
      });
    } catch (
      error
    ) {
      next(
        error,
      );
    }
  },
);

/* =========================================================
   LOGOUT
   ========================================================= */

router.post(
  "/logout",

  (
    _req,
    res,
  ) => {
    const options =
      getCookieOptions();

    res.clearCookie(
      env
        .REP_JWT_COOKIE_NAME,

      {
        httpOnly:
          options.httpOnly,

        secure:
          options.secure,

        sameSite:
          options.sameSite,

        path:
          options.path,
      },
    );

    res.json({
      success:
        true,

      message: {
        en:
          "Logged out successfully.",

        am:
          "Logout በተሳካ ሁኔታ ተደርጓል።",
      },
    });
  },
);

export default router;