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
  requireAdmin,
} from "../middleware/auth.middleware.js";

/* =========================================================
   ROUTER
   ========================================================= */

const router =
  Router();

/* =========================================================
   ADMIN SESSION CONFIGURATION

   JWT and browser cookie use the SAME lifetime.
   ========================================================= */

const ADMIN_SESSION_MAX_AGE_MS =
  7 *
  24 *
  60 *
  60 *
  1000;

const ADMIN_SESSION_EXPIRES_IN =
  "7d" as const;

/* =========================================================
   LOGIN RATE LIMIT

   IMPORTANT:

   Only POST /login uses this.

   GET /me is NOT rate limited by this limiter.

   POST /logout is NOT rate limited by this limiter.
   ========================================================= */

const loginLimiter =
  rateLimit({
    windowMs:
      15 *
      60 *
      1000,

    /*
      Ten failed login requests in a 15-minute window
      at the IP level.

      The database also has its own account-level
      5-failed-attempt lock below.
    */

    limit:
      10,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    /*
      Successful logins do not continue consuming
      the IP login-attempt allowance.
    */

    skipSuccessfulRequests:
      true,

    message: {
      success:
        false,

      message:
        "Too many login attempts. Try again in a few minutes.",
    },
  });

/* =========================================================
   LOGIN VALIDATION
   ========================================================= */

const loginSchema =
  z.object({
    username: z
      .string()
      .trim()
      .min(1)
      .max(50),

    password: z
      .string()
      .min(1)
      .max(128),
  });

/* =========================================================
   COOKIE OPTIONS
   ========================================================= */

function getCookieOptions():
  CookieOptions {
  const production =
    env.NODE_ENV ===
    "production";

  return {
    /*
      Prevent browser JavaScript from reading the JWT.
    */

    httpOnly:
      true,

    /*
      HTTPS-only in production.
    */

    secure:
      production,

    /*
      Production browser requests should travel through
      the same-origin /backend proxy.

      Lax is therefore appropriate and safer than
      SameSite=None for the normal admin flow.
    */

    sameSite:
      "lax",

    /*
      Cookie is available throughout the application.
    */

    path:
      "/",

    /*
      Match the JWT's 7-day lifetime.
    */

    maxAge:
      ADMIN_SESSION_MAX_AGE_MS,
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
  ) => {
    /* =====================================================
       VALIDATE REQUEST
       ===================================================== */

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

          message:
            "Invalid login information.",
        });

      return;
    }

    const {
      username,
      password,
    } =
      parsed.data;

    /* =====================================================
       FIND ADMIN
       ===================================================== */

    const result =
      await db.query(
        `
          SELECT
            id,
            username,
            name,
            email,
            password_hash,
            role,
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
      );

    const admin =
      result.rows[0];

    /* =====================================================
       INVALID USERNAME

       Keep message generic so the public API does not
       reveal whether a username exists.
       ===================================================== */

    if (
      !admin
    ) {
      res
        .status(
          401,
        )
        .json({
          success:
            false,

          message:
            "Invalid username or password.",
        });

      return;
    }

    /* =====================================================
       DISABLED ADMIN
       ===================================================== */

    if (
      !admin.is_active
    ) {
      res
        .status(
          403,
        )
        .json({
          success:
            false,

          message:
            "Account is disabled.",
        });

      return;
    }

    /* =====================================================
       DATABASE ACCOUNT LOCK
       ===================================================== */

    if (
      admin.locked_until &&
      new Date(
        admin.locked_until,
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

          message:
            "Too many failed login attempts. Try again later.",
        });

      return;
    }

    /* =====================================================
       VERIFY PASSWORD
       ===================================================== */

    const passwordMatches =
      await bcrypt.compare(
        password,
        admin.password_hash,
      );

    if (
      !passwordMatches
    ) {
      const currentAttempts =
        Number(
          admin.failed_login_attempts ??
            0,
        );

      const attempts =
        currentAttempts +
        1;

      const shouldLock =
        attempts >=
        5;

      /*
        If the fifth attempt is reached:

        - lock for 15 minutes
        - reset stored attempts to 0

        After the lock expires the next login cycle starts
        from a clean attempt count.
      */

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

          admin.id,
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

          message:
            shouldLock
              ? "Too many failed login attempts. Try again later."
              : "Invalid username or password.",
        });

      return;
    }

    /* =====================================================
       SUCCESSFUL LOGIN

       Clear lock/failed attempts and record login time.
       ===================================================== */

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
        admin.id,
      ],
    );

    /* =====================================================
       CREATE JWT
       ===================================================== */

    const token =
      jwt.sign(
        {
          role:
            "admin",

          username:
            admin.username,
        },

        env.JWT_SECRET,

        {
          algorithm:
            "HS256",

          subject:
            String(
              admin.id,
            ),

          expiresIn:
            ADMIN_SESSION_EXPIRES_IN,
        },
      );

    /* =====================================================
       SET HTTP-ONLY AUTH COOKIE
       ===================================================== */

    res.cookie(
      env.JWT_COOKIE_NAME,
      token,
      getCookieOptions(),
    );

    /* =====================================================
       RESPONSE
       ===================================================== */

    res.json({
      success:
        true,

      user: {
        id:
          admin.id,

        username:
          admin.username,

        name:
          admin.name,

        email:
          admin.email,

        role:
          "admin",
      },

      redirectTo:
        "/admin/dashboard",
    });
  },
);

/* =========================================================
   CURRENT ADMIN

   IMPORTANT:

   This route is intentionally NOT behind loginLimiter.

   Admin pages can safely check the current session without
   accidentally consuming login attempts.
   ========================================================= */

router.get(
  "/me",

  requireAdmin,

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
   LOGOUT
   ========================================================= */

router.post(
  "/logout",

  (
    _req,
    res,
  ) => {
    /*
      clearCookie must use the same important cookie
      attributes that were used when setting it.
    */

    const options =
      getCookieOptions();

    res.clearCookie(
      env.JWT_COOKIE_NAME,
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

      message:
        "Logged out successfully.",
    });
  },
);

export default router;