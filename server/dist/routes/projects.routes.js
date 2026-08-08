import { Router, } from "express";
import { db, } from "../config/db.js";
const router = Router();
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
/* =========================================================
   PUBLIC PROJECT LIST
   ========================================================= */
router.get("/", async (req, res) => {
    const featuredOnly = req.query.featured ===
        "true";
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

          WHERE
            status = 'published'
            AND (
              $1::BOOLEAN = FALSE
              OR featured = TRUE
            )

          ORDER BY
            featured DESC,
            sort_order ASC,
            created_at DESC
        `, [
        featuredOnly,
    ]);
    res.json({
        success: true,
        projects: result.rows.map(mapProject),
    });
});
/* =========================================================
   PROJECT BY SLUG
   ========================================================= */
router.get("/:slug", async (req, res) => {
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

          WHERE
            LOWER(slug) =
              LOWER($1)

            AND status =
              'published'

          LIMIT 1
        `, [
        req.params.slug,
    ]);
    const project = result.rows[0];
    if (!project) {
        res.status(404).json({
            success: false,
            message: {
                en: "Project not found.",
                am: "ፕሮጀክቱ አልተገኘም።",
            },
        });
        return;
    }
    res.json({
        success: true,
        project: mapProject(project),
    });
});
export default router;
