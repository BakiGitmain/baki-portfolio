import "dotenv/config";
import { z, } from "zod";
const envSchema = z.object({
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
        .default("development"),
    FRONTEND_URL: z
        .string()
        .min(1),
    DATABASE_URL: z
        .string()
        .min(1),
    JWT_SECRET: z
        .string()
        .min(32, "JWT_SECRET must be at least 32 characters."),
    JWT_COOKIE_NAME: z
        .string()
        .default("baki_admin_token"),
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
        .default("baki-portfolio/projects"),
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
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten()
        .fieldErrors);
    throw new Error("Invalid environment configuration.");
}
export const env = parsed.data;
