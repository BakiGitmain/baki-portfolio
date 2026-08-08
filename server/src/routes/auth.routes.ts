import {
  Router,
  type CookieOptions,
} from "express";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

const router =
  Router();

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

function getCookieOptions(): CookieOptions {
  const production =
    env.NODE_ENV ===
    "production";

  return {
    httpOnly: true,

    secure:
      production,

    sameSite:
      production
        ? "none"
        : "lax",

    path: "/",

    maxAge:
      8 *
      60 *
      60 *
      1000,
  };
}

/* =========================================================
   LOGIN
   ========================================================= */

router.post(
  "/login",
  async (
    req,
    res,
  ) => {
    const parsed =
      loginSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      res.status(
        400,
      ).json({
        success: false,

        message:
          "Invalid login information.",
      });

      return;
    }

    const {
      username,
      password,
    } = parsed.data;

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

    if (!admin) {
      res.status(
        401,
      ).json({
        success: false,

        message:
          "Invalid username or password.",
      });

      return;
    }

    if (
      !admin.is_active
    ) {
      res.status(
        403,
      ).json({
        success: false,

        message:
          "Account is disabled.",
      });

      return;
    }

    if (
      admin.locked_until &&
      new Date(
        admin.locked_until,
      ).getTime() >
        Date.now()
    ) {
      res.status(
        429,
      ).json({
        success: false,

        message:
          "Too many failed login attempts. Try again later.",
      });

      return;
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        admin.password_hash,
      );

    if (
      !passwordMatches
    ) {
      const attempts =
        Number(
          admin.failed_login_attempts ??
            0,
        ) + 1;

      const shouldLock =
        attempts >= 5;

      await db.query(
        `
          UPDATE admins
          SET
            failed_login_attempts = $1,

            locked_until =
              CASE
                WHEN $2 = TRUE
                THEN NOW() + INTERVAL '15 minutes'
                ELSE locked_until
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

      res.status(
        401,
      ).json({
        success: false,

        message:
          shouldLock
            ? "Too many failed login attempts. Try again later."
            : "Invalid username or password.",
      });

      return;
    }

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
            admin.id,

          expiresIn:
            "8h",
        },
      );

    res.cookie(
      env.JWT_COOKIE_NAME,
      token,
      getCookieOptions(),
    );

    res.json({
      success: true,

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
   ========================================================= */

router.get(
  "/me",
  requireAdmin,
  (
    req,
    res,
  ) => {
    res.json({
      success: true,

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
      success: true,

      message:
        "Logged out successfully.",
    });
  },
);

export default router;