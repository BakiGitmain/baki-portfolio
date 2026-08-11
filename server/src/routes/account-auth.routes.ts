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

/* =========================================================
   ROUTER
   ========================================================= */

const router =
  Router();

/* =========================================================
   SESSION
   ========================================================= */

const SESSION_MAX_AGE_MS =
  7 *
  24 *
  60 *
  60 *
  1000;

const SESSION_EXPIRES_IN =
  "7d" as const;

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
        .max(50),

    password:
      z
        .string()
        .min(1)
        .max(128),
  });

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
          "Too many login attempts. Try again in a few minutes.",

        am:
          "በጣም ብዙ የመግቢያ ሙከራዎች ተደርገዋል። ትንሽ ቆይተው ይሞክሩ።",
      },
    },
  });

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
      SESSION_MAX_AGE_MS,
  };
}

function getClearCookieOptions() {
  const options =
    getCookieOptions();

  return {
    httpOnly:
      options.httpOnly,

    secure:
      options.secure,

    sameSite:
      options.sameSite,

    path:
      options.path,
  };
}

/* =========================================================
   ERROR
   ========================================================= */

function invalidLoginResponse() {
  return {
    success:
      false,

    message: {
      en:
        "Invalid username or password.",

      am:
        "Username ወይም password ትክክል አይደለም።",
    },
  };
}

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
      /* ===================================================
         VALIDATE
         =================================================== */

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
                "Enter a valid username and password.",

              am:
                "ትክክለኛ username እና password ያስገቡ።",
            },
          });

        return;
      }

      const {
        username,
        password,
      } =
        parsed.data;

      /* ===================================================
         FIND ACCOUNT

         We search both account systems.

         The client never sends:
         role = admin
         role = representative

         The SERVER determines the role.
         =================================================== */

      const [
        adminResult,
        representativeResult,
      ] =
        await Promise.all([
          db.query(
            `
              SELECT
                id,
                username,
                name,
                email,
                password_hash,
                is_active,
                failed_login_attempts,
                locked_until
              FROM admins
              WHERE
                LOWER(username) =
                LOWER($1)
              LIMIT 1
            `,
            [
              username,
            ],
          ),

          db.query(
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
          ),
        ]);

      const admin =
        adminResult.rows[0];

      const representative =
        representativeResult
          .rows[0];

      /* ===================================================
         NO ACCOUNT
         =================================================== */

      if (
        !admin &&
        !representative
      ) {
        res
          .status(
            401,
          )
          .json(
            invalidLoginResponse(),
          );

        return;
      }

      /*
        This should practically never happen because
        representative usernames use PS-####.

        Still, do not allow ambiguous identity.
      */

      if (
        admin &&
        representative
      ) {
        res
          .status(
            401,
          )
          .json(
            invalidLoginResponse(),
          );

        return;
      }

      /* ===================================================
         DETERMINE ROLE
         =================================================== */

      const role:
        | "admin"
        | "representative" =
        admin
          ? "admin"
          : "representative";

      const account =
        admin ??
        representative;

      if (
        !account
      ) {
        res
          .status(
            401,
          )
          .json(
            invalidLoginResponse(),
          );

        return;
      }

      /* ===================================================
         ACTIVE ACCOUNT
         =================================================== */

      if (
        !account.is_active
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
                "This account is currently disabled.",

              am:
                "ይህ account በአሁኑ ጊዜ disabled ነው።",
            },
          });

        return;
      }

      /* ===================================================
         ACCOUNT LOCK
         =================================================== */

      if (
        account.locked_until &&
        new Date(
          account.locked_until,
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
         VERIFY PASSWORD
         =================================================== */

      const passwordMatches =
        await bcrypt.compare(
          password,

          account.password_hash,
        );

      if (
        !passwordMatches
      ) {
        const currentAttempts =
          Number(
            account
              .failed_login_attempts ??
              0,
          );

        const attempts =
          currentAttempts +
          1;

        const shouldLock =
          attempts >=
          5;

        if (
          role ===
          "admin"
        ) {
          await db.query(
            `
              UPDATE admins
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

              account.id,
            ],
          );
        } else {
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

              account.id,
            ],
          );
        }

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
         ADMIN SUCCESS
         =================================================== */

      if (
        role ===
        "admin"
      ) {
        await db.query(
          `
            UPDATE admins
            SET
              failed_login_attempts = 0,
              locked_until = NULL,
              last_login_at = NOW(),
              updated_at = NOW()
            WHERE id = $1
          `,
          [
            account.id,
          ],
        );

        const token =
          jwt.sign(
            {
              role:
                "admin",

              username:
                account.username,
            },

            env.JWT_SECRET,

            {
              algorithm:
                "HS256",

              subject:
                String(
                  account.id,
                ),

              expiresIn:
                SESSION_EXPIRES_IN,
            },
          );

        /*
          ONE SITE ACCOUNT AT A TIME.

          Clear representative session first.
        */

        res.clearCookie(
          env
            .REP_JWT_COOKIE_NAME,

          getClearCookieOptions(),
        );

        res.cookie(
          env.JWT_COOKIE_NAME,

          token,

          getCookieOptions(),
        );

        res.json({
          success:
            true,

          user: {
            id:
              account.id,

            username:
              account.username,

            name:
              account.name,

            email:
              account.email,

            role:
              "admin",
          },

          redirectTo:
            "/admin/dashboard",
        });

        return;
      }

      /* ===================================================
         REPRESENTATIVE SUCCESS
         =================================================== */

      const rep =
        representative!;

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
          rep.id,
        ],
      );

      const sessionVersion =
        Number(
          rep.session_version,
        );

      const mustChangePassword =
        Boolean(
          rep
            .must_change_password,
        );

      const token =
        jwt.sign(
          {
            role:
              "representative",

            username:
              rep.username,

            sessionVersion,
          },

          env.JWT_SECRET,

          {
            algorithm:
              "HS256",

            subject:
              String(
                rep.id,
              ),

            expiresIn:
              SESSION_EXPIRES_IN,
          },
        );

      /*
        Clear admin session before logging in as partner.
      */

      res.clearCookie(
        env.JWT_COOKIE_NAME,

        getClearCookieOptions(),
      );

      res.cookie(
        env
          .REP_JWT_COOKIE_NAME,

        token,

        getCookieOptions(),
      );

      res.json({
        success:
          true,

        user: {
          id:
            rep.id,

          username:
            rep.username,

          name:
            rep.name,

          email:
            rep.email,

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

export default router;