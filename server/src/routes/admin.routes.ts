import {
  Router,
} from "express";

import bcrypt from "bcryptjs";

import {
  rateLimit,
} from "../middleware/rate-limit.middleware.js";

import {
  z,
} from "zod";

import {
  db,
} from "../config/db.js";

import {
  requireAdmin,
} from "../middleware/auth.middleware.js";

const router =
  Router();
/* =========================================================
   ADMIN SESSION
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
   Only LOGIN is rate-limited.

   /me and /logout must not consume login attempts.
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

    /*
      A successful login should not keep consuming
      the visitor's login-attempt allowance.
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
   RATE LIMIT
   ========================================================= */

const sensitiveAdminLimiter =
  rateLimit({
    windowMs:
      15 *
      60 *
      1000,

    limit: 10,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      success: false,

      message:
        "Too many account update attempts. Try again later.",
    },
  });

/* =========================================================
   VALIDATION
   ========================================================= */

const updateAccountSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(120),

    username: z
      .string()
      .trim()
      .min(3)
      .max(50)
      .regex(
        /^[a-zA-Z0-9._-]+$/,
      ),

    email: z
      .string()
      .trim()
      .email()
      .max(255),

    currentPassword:
      z
        .string()
        .min(1)
        .max(128),

    newPassword:
      z.union([
        z.literal(""),

        z
          .string()
          .min(12)
          .max(128),
      ])
        .optional(),
  });

/* =========================================================
   UPDATE ACCOUNT
   ========================================================= */

router.patch(
  "/account",

  requireAdmin,

  sensitiveAdminLimiter,

  async (
    req,
    res,
  ) => {
    const parsed =
      updateAccountSchema.safeParse(
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
          "Invalid account information.",
      });

      return;
    }

    if (!req.auth) {
      res.status(
        401,
      ).json({
        success: false,

        message:
          "Authentication required.",
      });

      return;
    }

    const {
      name,
      username,
      email,
      currentPassword,
      newPassword,
    } = parsed.data;

    /* =====================================================
       LOAD CURRENT ADMIN
       ===================================================== */

    const currentResult =
      await db.query(
        `
          SELECT
            id,
            username,
            name,
            email,
            password_hash,
            role,
            is_active
          FROM admins
          WHERE id = $1
          LIMIT 1
        `,
        [
          req.auth.id,
        ],
      );

    const currentAdmin =
      currentResult.rows[0];

    if (
      !currentAdmin ||
      !currentAdmin.is_active
    ) {
      res.status(
        404,
      ).json({
        success: false,

        message:
          "Admin account not found.",
      });

      return;
    }

    /* =====================================================
       VERIFY CURRENT PASSWORD
       ===================================================== */

    const passwordMatches =
      await bcrypt.compare(
        currentPassword,
        currentAdmin.password_hash,
      );

    if (
      !passwordMatches
    ) {
      res.status(
        401,
      ).json({
        success: false,

        message:
          "Current password is incorrect.",
      });

      return;
    }

    /* =====================================================
       UNIQUE USERNAME / EMAIL
       ===================================================== */

    const duplicateResult =
      await db.query(
        `
          SELECT
            id,
            username,
            email
          FROM admins
          WHERE
            id <> $1
            AND (
              LOWER(username) = LOWER($2)
              OR LOWER(email) = LOWER($3)
            )
          LIMIT 1
        `,
        [
          req.auth.id,
          username,
          email,
        ],
      );

    const duplicate =
      duplicateResult.rows[0];

    if (duplicate) {
      if (
        duplicate.username
          .toLowerCase() ===
        username.toLowerCase()
      ) {
        res.status(
          409,
        ).json({
          success: false,

          message:
            "That username is already in use.",
        });

        return;
      }

      res.status(
        409,
      ).json({
        success: false,

        message:
          "That email is already in use.",
      });

      return;
    }

    /* =====================================================
       OPTIONAL PASSWORD CHANGE
       ===================================================== */

    const shouldChangePassword =
      Boolean(
        newPassword &&
          newPassword.length >
            0,
      );

    let newPasswordHash:
      | string
      | null =
        null;

    if (
      shouldChangePassword
    ) {
      if (
        newPassword ===
        currentPassword
      ) {
        res.status(
          400,
        ).json({
          success: false,

          message:
            "Your new password must be different from your current password.",
        });

        return;
      }

      newPasswordHash =
        await bcrypt.hash(
          newPassword as string,
          12,
        );
    }

    /* =====================================================
       UPDATE DATABASE
       ===================================================== */

    const updatedResult =
      await db.query(
        `
          UPDATE admins
          SET
            name = $1,
            username = $2,
            email = $3,

            password_hash =
              COALESCE(
                $4,
                password_hash
              ),

            failed_login_attempts = 0,
            locked_until = NULL,

            updated_at = NOW()

          WHERE id = $5

          RETURNING
            id,
            username,
            name,
            email,
            role
        `,
        [
          name,
          username,
          email.toLowerCase(),
          newPasswordHash,
          req.auth.id,
        ],
      );

    const updatedAdmin =
      updatedResult.rows[0];

    res.json({
      success: true,

      message:
        "Account updated successfully.",

      passwordChanged:
        shouldChangePassword,

      user: {
        id:
          updatedAdmin.id,

        username:
          updatedAdmin.username,

        name:
          updatedAdmin.name,

        email:
          updatedAdmin.email,

        role:
          updatedAdmin.role,
      },
    });
  },
);

export default router;
