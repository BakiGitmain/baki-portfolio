import {
  Router,
  type Response,
} from "express";

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
  requireAdmin,
} from "../middleware/auth.middleware.js";

/* =========================================================
   ROUTER
   ========================================================= */

const router =
  Router();

/* =========================================================
   TYPES
   ========================================================= */

type SiteRow = {
  id:
    string;

  name:
    string;

  slug:
    string;

  frontend_url:
    string;

  backend_url:
    string | null;

  health_url:
    string | null;

  vercel_project_id:
    string | null;

  vercel_team_id:
    string | null;

  analytics_enabled:
    boolean;

  monitoring_enabled:
    boolean;

  created_by:
    string | null;

  created_at:
    Date;

  updated_at:
    Date;
};

/* =========================================================
   HELPERS
   ========================================================= */

function mapSite(
  site:
    SiteRow,
) {
  return {
    id:
      site.id,

    name:
      site.name,

    slug:
      site.slug,

    frontendUrl:
      site.frontend_url,

    backendUrl:
      site.backend_url,

    healthUrl:
      site.health_url,

    vercelProjectId:
      site.vercel_project_id,

    vercelTeamId:
      site.vercel_team_id,

    analyticsEnabled:
      site.analytics_enabled,

    monitoringEnabled:
      site.monitoring_enabled,

    createdAt:
      site.created_at,

    updatedAt:
      site.updated_at,
  };
}

function errorResponse(
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
  res
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

function cleanOptionalValue(
  value:
    string,
) {
  const cleaned =
    value.trim();

  return cleaned
    ? cleaned
    : null;
}

/* =========================================================
   VALIDATION
   ========================================================= */

const httpUrlSchema =
  z
    .string()
    .trim()
    .max(
      2000,
    )
    .url()
    .refine(
      (
        value,
      ) => {
        try {
          const url =
            new URL(
              value,
            );

          return (
            url.protocol ===
              "http:" ||
            url.protocol ===
              "https:"
          );
        } catch {
          return false;
        }
      },
      {
        message:
          "Only HTTP and HTTPS URLs are allowed.",
      },
    );

const optionalUrlSchema =
  z.union([
    z.literal(
      "",
    ),

    httpUrlSchema,
  ]);

const siteSchema =
  z.object({
    name:
      z
        .string()
        .trim()
        .min(
          2,
        )
        .max(
          120,
        ),

    slug:
      z
        .string()
        .trim()
        .min(
          2,
        )
        .max(
          160,
        )
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        ),

    frontendUrl:
      httpUrlSchema,

    backendUrl:
      optionalUrlSchema,

    healthUrl:
      optionalUrlSchema,

    vercelProjectId:
      z
        .string()
        .trim()
        .max(
          255,
        ),

    vercelTeamId:
      z
        .string()
        .trim()
        .max(
          255,
        ),

    analyticsEnabled:
      z.boolean(),

    monitoringEnabled:
      z.boolean(),
  });

const idSchema =
  z
    .string()
    .uuid();

/* =========================================================
   RATE LIMIT
   ========================================================= */

const siteWriteLimiter =
  rateLimit({
    windowMs:
      15 *
      60 *
      1000,

    limit:
      80,

    standardHeaders:
      true,

    legacyHeaders:
      false,
  });

/* =========================================================
   AUTH
   ========================================================= */

router.use(
  requireAdmin,
);

/* =========================================================
   GET ALL SITES
   ========================================================= */

router.get(
  "/",

  async (
    _req,
    res,
  ) => {
    const result =
      await db.query<SiteRow>(
        `
          SELECT
            id,
            name,
            slug,

            frontend_url,
            backend_url,
            health_url,

            vercel_project_id,
            vercel_team_id,

            analytics_enabled,
            monitoring_enabled,

            created_by,
            created_at,
            updated_at

          FROM monitored_sites

          ORDER BY
            created_at DESC
        `,
      );

    res.json({
      success:
        true,

      sites:
        result.rows.map(
          mapSite,
        ),
    });
  },
);

/* =========================================================
   GET ONE SITE
   ========================================================= */

router.get(
  "/:id",

  async (
    req,
    res,
  ) => {
    const parsedId =
      idSchema.safeParse(
        req.params.id,
      );

    if (
      !parsedId.success
    ) {
      errorResponse(
        res,
        400,
        "INVALID_SITE_ID",
        "Invalid site ID.",
        "የድረ-ገጹ ID ትክክል አይደለም።",
      );

      return;
    }

    const result =
      await db.query<SiteRow>(
        `
          SELECT
            id,
            name,
            slug,

            frontend_url,
            backend_url,
            health_url,

            vercel_project_id,
            vercel_team_id,

            analytics_enabled,
            monitoring_enabled,

            created_by,
            created_at,
            updated_at

          FROM monitored_sites

          WHERE id = $1

          LIMIT 1
        `,
        [
          parsedId.data,
        ],
      );

    const site =
      result.rows[0];

    if (
      !site
    ) {
      errorResponse(
        res,
        404,
        "SITE_NOT_FOUND",
        "Site not found.",
        "ድረ-ገጹ አልተገኘም።",
      );

      return;
    }

    res.json({
      success:
        true,

      site:
        mapSite(
          site,
        ),
    });
  },
);

/* =========================================================
   CREATE SITE
   ========================================================= */

router.post(
  "/",

  siteWriteLimiter,

  async (
    req,
    res,
  ) => {
    const parsed =
      siteSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      errorResponse(
        res,
        400,
        "INVALID_SITE",
        "Check the site information and try again.",
        "የድረ-ገጹን መረጃ ያረጋግጡ እና እንደገና ይሞክሩ።",
      );

      return;
    }

    if (
      !req.auth
    ) {
      errorResponse(
        res,
        401,
        "AUTH_REQUIRED",
        "Authentication required.",
        "መግባት ያስፈልጋል።",
      );

      return;
    }

    const data =
      parsed.data;

    try {
      const result =
        await db.query<SiteRow>(
          `
            INSERT INTO monitored_sites (
              name,
              slug,

              frontend_url,
              backend_url,
              health_url,

              vercel_project_id,
              vercel_team_id,

              analytics_enabled,
              monitoring_enabled,

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

              $10
            )

            RETURNING *
          `,
          [
            data.name,

            data.slug,

            data.frontendUrl,

            cleanOptionalValue(
              data.backendUrl,
            ),

            cleanOptionalValue(
              data.healthUrl,
            ),

            cleanOptionalValue(
              data.vercelProjectId,
            ),

            cleanOptionalValue(
              data.vercelTeamId,
            ),

            data.analyticsEnabled,

            data.monitoringEnabled,

            req.auth.id,
          ],
        );

      const site =
        result.rows[0];

      if (
        !site
      ) {
        errorResponse(
          res,
          500,
          "CREATE_FAILED",
          "Site could not be created.",
          "ድረ-ገጹን መፍጠር አልተቻለም።",
        );

        return;
      }

      res
        .status(
          201,
        )
        .json({
          success:
            true,

          site:
            mapSite(
              site,
            ),
        });
    } catch (
      error:
        unknown
    ) {
      const pgError =
        error as {
          code?:
            string;
        };

      if (
        pgError.code ===
        "23505"
      ) {
        errorResponse(
          res,
          409,
          "SITE_SLUG_EXISTS",
          "A site with this slug already exists.",
          "በዚህ slug የተመዘገበ ድረ-ገጽ አለ።",
        );

        return;
      }

      throw error;
    }
  },
);

/* =========================================================
   UPDATE SITE
   ========================================================= */

router.patch(
  "/:id",

  siteWriteLimiter,

  async (
    req,
    res,
  ) => {
    const parsedId =
      idSchema.safeParse(
        req.params.id,
      );

    if (
      !parsedId.success
    ) {
      errorResponse(
        res,
        400,
        "INVALID_SITE_ID",
        "Invalid site ID.",
        "የድረ-ገጹ ID ትክክል አይደለም።",
      );

      return;
    }

    const parsed =
      siteSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      errorResponse(
        res,
        400,
        "INVALID_SITE",
        "Check the site information and try again.",
        "የድረ-ገጹን መረጃ ያረጋግጡ እና እንደገና ይሞክሩ።",
      );

      return;
    }

    const data =
      parsed.data;

    try {
      const result =
        await db.query<SiteRow>(
          `
            UPDATE monitored_sites

            SET
              name = $1,
              slug = $2,

              frontend_url = $3,
              backend_url = $4,
              health_url = $5,

              vercel_project_id = $6,
              vercel_team_id = $7,

              analytics_enabled = $8,
              monitoring_enabled = $9,

              updated_at = NOW()

            WHERE id = $10

            RETURNING *
          `,
          [
            data.name,

            data.slug,

            data.frontendUrl,

            cleanOptionalValue(
              data.backendUrl,
            ),

            cleanOptionalValue(
              data.healthUrl,
            ),

            cleanOptionalValue(
              data.vercelProjectId,
            ),

            cleanOptionalValue(
              data.vercelTeamId,
            ),

            data.analyticsEnabled,

            data.monitoringEnabled,

            parsedId.data,
          ],
        );

      const site =
        result.rows[0];

      if (
        !site
      ) {
        errorResponse(
          res,
          404,
          "SITE_NOT_FOUND",
          "Site not found.",
          "ድረ-ገጹ አልተገኘም።",
        );

        return;
      }

      res.json({
        success:
          true,

        site:
          mapSite(
            site,
          ),
      });
    } catch (
      error:
        unknown
    ) {
      const pgError =
        error as {
          code?:
            string;
        };

      if (
        pgError.code ===
        "23505"
      ) {
        errorResponse(
          res,
          409,
          "SITE_SLUG_EXISTS",
          "A site with this slug already exists.",
          "በዚህ slug የተመዘገበ ድረ-ገጽ አለ።",
        );

        return;
      }

      throw error;
    }
  },
);

/* =========================================================
   DELETE SITE
   ========================================================= */

router.delete(
  "/:id",

  siteWriteLimiter,

  async (
    req,
    res,
  ) => {
    const parsedId =
      idSchema.safeParse(
        req.params.id,
      );

    if (
      !parsedId.success
    ) {
      errorResponse(
        res,
        400,
        "INVALID_SITE_ID",
        "Invalid site ID.",
        "የድረ-ገጹ ID ትክክል አይደለም።",
      );

      return;
    }

    const result =
      await db.query<{
        id:
          string;
      }>(
        `
          DELETE FROM monitored_sites

          WHERE id = $1

          RETURNING id
        `,
        [
          parsedId.data,
        ],
      );

    if (
      !result.rows[0]
    ) {
      errorResponse(
        res,
        404,
        "SITE_NOT_FOUND",
        "Site not found.",
        "ድረ-ገጹ አልተገኘም።",
      );

      return;
    }

    res.json({
      success:
        true,

      deletedId:
        parsedId.data,
    });
  },
);

export default router;