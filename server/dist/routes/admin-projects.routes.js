import { randomUUID, } from "node:crypto";
import { Router, } from "express";
import { rateLimit, } from "express-rate-limit";
import { z, } from "zod";
import { cloudinary, } from "../config/cloudinary.js";
import { db, } from "../config/db.js";
import { env, } from "../config/env.js";
import { requireAdmin, } from "../middleware/auth.middleware.js";
const router = Router();
const MAX_PROJECT_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_PROJECT_FORMATS = new Set([
    "jpg",
    "jpeg",
    "png",
    "webp",
]);
/* =========================================================
   HELPERS
   ========================================================= */
function mapProject(project) {
    return {
        id: project.id,
        slug: project.slug,
        titleEn: project.title_en,
        titleAm: project.title_am,
        categoryEn: project.category_en,
        categoryAm: project.category_am,
        shortDescriptionEn: project.short_description_en,
        shortDescriptionAm: project.short_description_am,
        descriptionEn: project.description_en,
        descriptionAm: project.description_am,
        technologies: project.technologies,
        coverImageUrl: project.cover_image_url,
        coverImagePublicId: project.cover_image_public_id,
        liveUrl: project.live_url,
        status: project.status,
        featured: project.featured,
        sortOrder: project.sort_order,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
    };
}
function errorResponse(res, status, code, en, am) {
    res.status(status).json({
        success: false,
        code,
        message: {
            en,
            am,
        },
    });
}
async function safelyDeleteImage(publicId) {
    if (!publicId) {
        return;
    }
    if (!publicId.startsWith(`${env.CLOUDINARY_PROJECT_FOLDER}/`)) {
        return;
    }
    try {
        await cloudinary.uploader.destroy(publicId, {
            invalidate: true,
            resource_type: "image",
        });
    }
    catch (error) {
        console.error("Cloudinary image cleanup failed:", error);
    }
}
async function verifyProjectImage(publicId) {
    const prefix = `${env.CLOUDINARY_PROJECT_FOLDER}/`;
    if (!publicId.startsWith(prefix)) {
        throw new Error("INVALID_PROJECT_IMAGE");
    }
    const resource = await cloudinary.api.resource(publicId, {
        resource_type: "image",
    });
    if (resource.resource_type !==
        "image") {
        throw new Error("INVALID_PROJECT_IMAGE");
    }
    const format = String(resource.format ??
        "").toLowerCase();
    if (!ALLOWED_PROJECT_FORMATS.has(format)) {
        throw new Error("INVALID_PROJECT_IMAGE");
    }
    if (Number(resource.bytes ??
        0) >
        MAX_PROJECT_IMAGE_BYTES) {
        throw new Error("PROJECT_IMAGE_TOO_LARGE");
    }
    if (typeof resource.secure_url !==
        "string" ||
        !resource.secure_url) {
        throw new Error("INVALID_PROJECT_IMAGE");
    }
    return {
        secureUrl: resource.secure_url,
        publicId: resource.public_id,
    };
}
/* =========================================================
   VALIDATION
   ========================================================= */
const projectSchema = z.object({
    slug: z
        .string()
        .trim()
        .min(2)
        .max(160)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    titleEn: z
        .string()
        .trim()
        .min(2)
        .max(180),
    titleAm: z
        .string()
        .trim()
        .min(2)
        .max(180),
    categoryEn: z
        .string()
        .trim()
        .min(2)
        .max(120),
    categoryAm: z
        .string()
        .trim()
        .min(2)
        .max(120),
    shortDescriptionEn: z
        .string()
        .trim()
        .min(10)
        .max(500),
    shortDescriptionAm: z
        .string()
        .trim()
        .min(10)
        .max(500),
    descriptionEn: z
        .string()
        .trim()
        .min(20)
        .max(10000),
    descriptionAm: z
        .string()
        .trim()
        .min(20)
        .max(10000),
    technologies: z
        .array(z
        .string()
        .trim()
        .min(1)
        .max(50))
        .max(30),
    liveUrl: z
        .union([
        z.literal(""),
        z
            .string()
            .url(),
    ]),
    coverImagePublicId: z
        .string()
        .min(1),
    status: z.enum([
        "draft",
        "published",
    ]),
    featured: z.boolean(),
    sortOrder: z
        .number()
        .int()
        .min(0)
        .max(10000),
});
/* =========================================================
   RATE LIMIT
   ========================================================= */
const projectWriteLimiter = rateLimit({
    windowMs: 15 *
        60 *
        1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
});
router.use(requireAdmin);
/* =========================================================
   GET ADMIN PROJECTS
   ========================================================= */
router.get("/", async (_req, res) => {
    const result = await db.query(`
          SELECT
            id,
            slug,
            title_en,
            title_am,
            category_en,
            category_am,
            short_description_en,
            short_description_am,
            description_en,
            description_am,
            technologies,
            cover_image_url,
            cover_image_public_id,
            live_url,
            status,
            featured,
            sort_order,
            created_at,
            updated_at

          FROM projects

          ORDER BY
            sort_order ASC,
            created_at DESC
        `);
    res.json({
        success: true,
        projects: result.rows.map(mapProject),
    });
});
/* =========================================================
   SIGN CLOUDINARY UPLOAD
   ========================================================= */
router.post("/upload-signature", projectWriteLimiter, async (_req, res) => {
    const timestamp = Math.floor(Date.now() /
        1000);
    const publicId = randomUUID();
    const parameters = {
        timestamp,
        folder: env.CLOUDINARY_PROJECT_FOLDER,
        public_id: publicId,
    };
    const signature = cloudinary.utils.api_sign_request(parameters, env.CLOUDINARY_API_SECRET);
    res.json({
        success: true,
        uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
        apiKey: env.CLOUDINARY_API_KEY,
        signature,
        parameters,
    });
});
/* =========================================================
   CREATE PROJECT
   ========================================================= */
router.post("/", projectWriteLimiter, async (req, res) => {
    const parsed = projectSchema.safeParse(req.body);
    if (!parsed.success) {
        errorResponse(res, 400, "INVALID_PROJECT", "Check the project information and try again.", "የፕሮጀክቱን መረጃ ያረጋግጡ እና እንደገና ይሞክሩ።");
        return;
    }
    if (!req.auth) {
        errorResponse(res, 401, "AUTH_REQUIRED", "Authentication required.", "መግባት ያስፈልጋል።");
        return;
    }
    const data = parsed.data;
    let image;
    try {
        image =
            await verifyProjectImage(data.coverImagePublicId);
    }
    catch {
        errorResponse(res, 400, "INVALID_PROJECT_IMAGE", "The project image is invalid.", "የፕሮጀክቱ ምስል ትክክል አይደለም።");
        return;
    }
    try {
        const result = await db.query(`
            INSERT INTO projects (
              slug,

              title_en,
              title_am,

              category_en,
              category_am,

              short_description_en,
              short_description_am,

              description_en,
              description_am,

              technologies,

              cover_image_url,
              cover_image_public_id,

              live_url,

              status,
              featured,
              sort_order,

              created_by
            )

            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              $9,
              $10,
              $11,
              $12,
              $13,
              $14,
              $15,
              $16,
              $17
            )

            RETURNING *
          `, [
            data.slug,
            data.titleEn,
            data.titleAm,
            data.categoryEn,
            data.categoryAm,
            data.shortDescriptionEn,
            data.shortDescriptionAm,
            data.descriptionEn,
            data.descriptionAm,
            data.technologies,
            image.secureUrl,
            image.publicId,
            data.liveUrl ||
                null,
            data.status,
            data.featured,
            data.sortOrder,
            req.auth.id,
        ]);
        res.status(201).json({
            success: true,
            message: {
                en: "Project created successfully.",
                am: "ፕሮጀክቱ በተሳካ ሁኔታ ተፈጥሯል።",
            },
            project: mapProject(result.rows[0]),
        });
    }
    catch (error) {
        const pgError = error;
        if (pgError.code ===
            "23505") {
            await safelyDeleteImage(image.publicId);
            errorResponse(res, 409, "SLUG_EXISTS", "A project with that slug already exists.", "በዚህ slug የተመዘገበ ፕሮጀክት አለ።");
            return;
        }
        throw error;
    }
});
/* =========================================================
   UPDATE PROJECT
   ========================================================= */
router.patch("/:id", projectWriteLimiter, async (req, res) => {
    const parsed = projectSchema.safeParse(req.body);
    if (!parsed.success) {
        errorResponse(res, 400, "INVALID_PROJECT", "Check the project information and try again.", "የፕሮጀክቱን መረጃ ያረጋግጡ እና እንደገና ይሞክሩ።");
        return;
    }
    const existingResult = await db.query(`
          SELECT
            cover_image_public_id

          FROM projects

          WHERE id = $1

          LIMIT 1
        `, [
        req.params.id,
    ]);
    const existing = existingResult.rows[0];
    if (!existing) {
        errorResponse(res, 404, "PROJECT_NOT_FOUND", "Project not found.", "ፕሮጀክቱ አልተገኘም።");
        return;
    }
    const data = parsed.data;
    let image;
    try {
        image =
            await verifyProjectImage(data.coverImagePublicId);
    }
    catch {
        errorResponse(res, 400, "INVALID_PROJECT_IMAGE", "The project image is invalid.", "የፕሮጀክቱ ምስል ትክክል አይደለም።");
        return;
    }
    const changedImage = existing.cover_image_public_id !==
        image.publicId;
    try {
        const result = await db.query(`
            UPDATE projects

            SET
              slug = $1,

              title_en = $2,
              title_am = $3,

              category_en = $4,
              category_am = $5,

              short_description_en = $6,
              short_description_am = $7,

              description_en = $8,
              description_am = $9,

              technologies = $10,

              cover_image_url = $11,
              cover_image_public_id = $12,

              live_url = $13,

              status = $14,
              featured = $15,
              sort_order = $16,

              updated_at = NOW()

            WHERE id = $17

            RETURNING *
          `, [
            data.slug,
            data.titleEn,
            data.titleAm,
            data.categoryEn,
            data.categoryAm,
            data.shortDescriptionEn,
            data.shortDescriptionAm,
            data.descriptionEn,
            data.descriptionAm,
            data.technologies,
            image.secureUrl,
            image.publicId,
            data.liveUrl ||
                null,
            data.status,
            data.featured,
            data.sortOrder,
            req.params.id,
        ]);
        if (changedImage) {
            await safelyDeleteImage(existing.cover_image_public_id);
        }
        res.json({
            success: true,
            message: {
                en: "Project updated successfully.",
                am: "ፕሮጀክቱ በተሳካ ሁኔታ ተቀይሯል።",
            },
            project: mapProject(result.rows[0]),
        });
    }
    catch (error) {
        const pgError = error;
        if (pgError.code ===
            "23505") {
            if (changedImage) {
                await safelyDeleteImage(image.publicId);
            }
            errorResponse(res, 409, "SLUG_EXISTS", "A project with that slug already exists.", "በዚህ slug የተመዘገበ ፕሮጀክት አለ።");
            return;
        }
        throw error;
    }
});
/* =========================================================
   DELETE PROJECT
   ========================================================= */
router.delete("/:id", projectWriteLimiter, async (req, res) => {
    const result = await db.query(`
          DELETE FROM projects

          WHERE id = $1

          RETURNING
            cover_image_public_id
        `, [
        req.params.id,
    ]);
    const project = result.rows[0];
    if (!project) {
        errorResponse(res, 404, "PROJECT_NOT_FOUND", "Project not found.", "ፕሮጀክቱ አልተገኘም።");
        return;
    }
    await safelyDeleteImage(project.cover_image_public_id);
    res.json({
        success: true,
        message: {
            en: "Project deleted successfully.",
            am: "ፕሮጀክቱ ተሰርዟል።",
        },
    });
});
export default router;
