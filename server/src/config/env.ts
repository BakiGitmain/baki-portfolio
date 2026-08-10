import "dotenv/config";

import {
  z,
} from "zod";

const envSchema =
  z.object({
    /* =====================================================
       SERVER
       ===================================================== */

    PORT: z.coerce
      .number()
      .int()
      .positive()
      .default(5000),

    NODE_ENV: z
      .enum([
        "development",
        "production",
        "test",
      ])
      .default(
        "development",
      ),

    FRONTEND_URL: z
      .string()
      .min(1),

    /* =====================================================
       DATABASE
       ===================================================== */

    DATABASE_URL: z
      .string()
      .min(1),

    /* =====================================================
       AUTH
       ===================================================== */

    JWT_SECRET: z
      .string()
      .min(
        32,
        "JWT_SECRET must be at least 32 characters.",
      ),

    JWT_COOKIE_NAME: z
      .string()
      .default(
        "baki_admin_token",
      ),

    /* =====================================================
       MISTRAL / BAKI AI
       ===================================================== */

    MISTRAL_API_KEY: z
      .string()
      .min(
        1,
        "MISTRAL_API_KEY is required.",
      ),

    MISTRAL_MODEL: z
      .string()
      .min(1)
      .default(
        "mistral-small-latest",
      ),

    /* =====================================================
       CLOUDINARY
       ===================================================== */

    CLOUDINARY_CLOUD_NAME: z
      .string()
      .min(1),

    CLOUDINARY_API_KEY: z
      .string()
      .min(1),

    CLOUDINARY_API_SECRET: z
      .string()
      .min(1),

    CLOUDINARY_PROJECT_FOLDER: z
      .string()
      .min(1)
      .default(
        "baki-portfolio/projects",
      ),

    /* =====================================================
       ADMIN SEED
       ===================================================== */

    ADMIN_SEED_NAME: z
      .string()
      .optional(),

    ADMIN_SEED_USERNAME: z
      .string()
      .optional(),

    ADMIN_SEED_EMAIL: z
      .string()
      .optional(),

    ADMIN_SEED_PASSWORD: z
      .string()
      .optional(),
  });

/* =========================================================
   VALIDATE ENVIRONMENT
   ========================================================= */

const parsed =
  envSchema.safeParse(
    process.env,
  );

if (
  !parsed.success
) {
  console.error(
    "Invalid environment variables:",
    parsed.error
      .flatten()
      .fieldErrors,
  );

  throw new Error(
    "Invalid environment configuration.",
  );
}

/* =========================================================
   EXPORT
   ========================================================= */

export const env =
  parsed.data;