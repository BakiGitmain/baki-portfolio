import {
  randomUUID,
} from "node:crypto";

import {
  Router,
  type Response,
} from "express";

import {
  rateLimit,
} from "../middleware/rate-limit.middleware.js";

import {
  z,
} from "zod";

import {
  cloudinary,
} from "../config/cloudinary.js";

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

const MAX_PROJECT_IMAGE_BYTES =
  8 * 1024 * 1024;

const ALLOWED_PROJECT_FORMATS =
  new Set([
    "jpg",
    "jpeg",
    "png",
    "webp",
  ]);

/* =========================================================
   TYPES
   ========================================================= */

type StoredGalleryImage = {
  publicId:
    string;

  url:
    string;

  altEn:
    string;

  altAm:
    string;
};

type ProjectStep = {
  title: {
    en:
      string;

    am:
      string;
  };

  description: {
    en:
      string;

    am:
      string;
  };
};

type LocalizedText = {
  en:
    string;

  am:
    string;
};

type ProjectRow = {
  id:
    string;

  slug:
    string;

  title_en:
    string;

  title_am:
    string;

  category_en:
    string;

  category_am:
    string;

  short_description_en:
    string;

  short_description_am:
    string;

  description_en:
    string;

  description_am:
    string;

  technologies:
    string[];

  cover_image_url:
    string;

  cover_image_public_id:
    string;

  live_url:
    string | null;

  status:
    "draft" | "published";

  featured:
    boolean;

  sort_order:
    number;

  project_year:
    string;

  role_en:
    string;

  role_am:
    string;

  display_status_en:
    string;

  display_status_am:
    string;

  overview_en:
    string;

  overview_am:
    string;

  challenge_en:
    string;

  challenge_am:
    string;

  solution_en:
    string;

  solution_am:
    string;

  how_it_works:
    unknown;

  features:
    unknown;

  gallery:
    unknown;

  created_at:
    Date;

  updated_at:
    Date;
};

type VerifiedProjectImage =
  Awaited<
    ReturnType<
      typeof verifyProjectImage
    >
  >;

/* =========================================================
   NORMALIZE DB VALUES
   ========================================================= */

function normalizeGallery(
  value:
    unknown,
): StoredGalleryImage[] {
  if (
    !Array.isArray(
      value,
    )
  ) {
    return [];
  }

  return value.flatMap(
    (
      item,
    ) => {
      if (
        typeof item !==
          "object" ||
        item ===
          null
      ) {
        return [];
      }

      const candidate =
        item as Partial<StoredGalleryImage>;

      if (
        typeof candidate.publicId !==
          "string" ||
        typeof candidate.url !==
          "string"
      ) {
        return [];
      }

      return [
        {
          publicId:
            candidate.publicId,

          url:
            candidate.url,

          altEn:
            typeof candidate.altEn ===
              "string"
              ? candidate.altEn
              : "",

          altAm:
            typeof candidate.altAm ===
              "string"
              ? candidate.altAm
              : "",
        },
      ];
    },
  );
}

function normalizeHowItWorks(
  value:
    unknown,
): ProjectStep[] {
  return Array.isArray(
    value,
  )
    ? value as ProjectStep[]
    : [];
}

function normalizeFeatures(
  value:
    unknown,
): LocalizedText[] {
  return Array.isArray(
    value,
  )
    ? value as LocalizedText[]
    : [];
}

/* =========================================================
   MAP
   ========================================================= */

function mapProject(
  project:
    ProjectRow,
) {
  return {
    id:
      project.id,

    slug:
      project.slug,

    titleEn:
      project.title_en,

    titleAm:
      project.title_am,

    categoryEn:
      project.category_en,

    categoryAm:
      project.category_am,

    shortDescriptionEn:
      project.short_description_en,

    shortDescriptionAm:
      project.short_description_am,

    descriptionEn:
      project.description_en,

    descriptionAm:
      project.description_am,

    technologies:
      project.technologies,

    coverImageUrl:
      project.cover_image_url,

    coverImagePublicId:
      project.cover_image_public_id,

    liveUrl:
      project.live_url,

    status:
      project.status,

    featured:
      project.featured,

    sortOrder:
      project.sort_order,

    projectYear:
      project.project_year,

    roleEn:
      project.role_en,

    roleAm:
      project.role_am,

    displayStatusEn:
      project.display_status_en,

    displayStatusAm:
      project.display_status_am,

    overviewEn:
      project.overview_en,

    overviewAm:
      project.overview_am,

    challengeEn:
      project.challenge_en,

    challengeAm:
      project.challenge_am,

    solutionEn:
      project.solution_en,

    solutionAm:
      project.solution_am,

    howItWorks:
      normalizeHowItWorks(
        project.how_it_works,
      ),

    features:
      normalizeFeatures(
        project.features,
      ),

    gallery:
      normalizeGallery(
        project.gallery,
      ),

    createdAt:
      project.created_at,

    updatedAt:
      project.updated_at,
  };
}

/* =========================================================
   ERRORS
   ========================================================= */

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

/* =========================================================
   CLOUDINARY
   ========================================================= */

async function safelyDeleteImage(
  publicId:
    | string
    | null
    | undefined,
) {
  if (!publicId) {
    return;
  }

  if (
    !publicId.startsWith(
      `${env.CLOUDINARY_PROJECT_FOLDER}/`,
    )
  ) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(
      publicId,
      {
        invalidate:
          true,

        resource_type:
          "image",
      },
    );
  } catch (
    error
  ) {
    console.error(
      "Cloudinary cleanup failed:",
      error,
    );
  }
}

async function safelyDeleteImages(
  publicIds:
    string[],
) {
  const uniqueIds =
    [
      ...new Set(
        publicIds,
      ),
    ];

  await Promise.allSettled(
    uniqueIds.map(
      (
        publicId,
      ) =>
        safelyDeleteImage(
          publicId,
        ),
    ),
  );
}

async function verifyProjectImage(
  publicId:
    string,
) {
  const prefix =
    `${env.CLOUDINARY_PROJECT_FOLDER}/`;

  if (
    !publicId.startsWith(
      prefix,
    )
  ) {
    throw new Error(
      "INVALID_PROJECT_IMAGE",
    );
  }

  const resource =
    await cloudinary.api.resource(
      publicId,
      {
        resource_type:
          "image",
      },
    );

  const format =
    String(
      resource.format ??
        "",
    ).toLowerCase();

  if (
    resource.resource_type !==
      "image" ||
    !ALLOWED_PROJECT_FORMATS.has(
      format,
    ) ||
    Number(
      resource.bytes ??
        0,
    ) >
      MAX_PROJECT_IMAGE_BYTES ||
    typeof resource.secure_url !==
      "string" ||
    !resource.secure_url ||
    typeof resource.public_id !==
      "string" ||
    !resource.public_id
  ) {
    throw new Error(
      "INVALID_PROJECT_IMAGE",
    );
  }

  return {
    secureUrl:
      resource.secure_url,

    publicId:
      resource.public_id,
  };
}

/* =========================================================
   VALIDATION
   ========================================================= */

const localizedTextSchema =
  z.object({
    en:
      z
        .string()
        .trim()
        .min(1)
        .max(500),

    am:
      z
        .string()
        .trim()
        .min(1)
        .max(500),
  });

const projectStepSchema =
  z.object({
    title:
      localizedTextSchema,

    description:
      z.object({
        en:
          z
            .string()
            .trim()
            .min(1)
            .max(1500),

        am:
          z
            .string()
            .trim()
            .min(1)
            .max(1500),
      }),
  });

const galleryInputSchema =
  z.object({
    publicId:
      z
        .string()
        .trim()
        .min(1),

    altEn:
      z
        .string()
        .trim()
        .max(250),

    altAm:
      z
        .string()
        .trim()
        .max(250),
  });

const projectSchema =
  z.object({
    slug:
      z
        .string()
        .trim()
        .min(2)
        .max(160)
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        ),

    titleEn:
      z
        .string()
        .trim()
        .min(2)
        .max(180),

    titleAm:
      z
        .string()
        .trim()
        .min(2)
        .max(180),

    categoryEn:
      z
        .string()
        .trim()
        .min(2)
        .max(120),

    categoryAm:
      z
        .string()
        .trim()
        .min(2)
        .max(120),

    shortDescriptionEn:
      z
        .string()
        .trim()
        .min(10)
        .max(500),

    shortDescriptionAm:
      z
        .string()
        .trim()
        .min(10)
        .max(500),

    descriptionEn:
      z
        .string()
        .trim()
        .min(20)
        .max(10000),

    descriptionAm:
      z
        .string()
        .trim()
        .min(20)
        .max(10000),

    technologies:
      z
        .array(
          z
            .string()
            .trim()
            .min(1)
            .max(50),
        )
        .max(30),

    liveUrl:
      z.union([
        z.literal(
          "",
        ),

        z
          .string()
          .url(),
      ]),

    coverImagePublicId:
      z
        .string()
        .min(1),

    status:
      z.enum([
        "draft",
        "published",
      ]),

    featured:
      z.boolean(),

    sortOrder:
      z
        .number()
        .int()
        .min(0)
        .max(10000),

    projectYear:
      z
        .string()
        .trim()
        .min(1)
        .max(20),

    roleEn:
      z
        .string()
        .trim()
        .min(2)
        .max(300),

    roleAm:
      z
        .string()
        .trim()
        .min(2)
        .max(300),

    displayStatusEn:
      z
        .string()
        .trim()
        .min(2)
        .max(100),

    displayStatusAm:
      z
        .string()
        .trim()
        .min(2)
        .max(100),

    overviewEn:
      z
        .string()
        .trim()
        .min(5)
        .max(10000),

    overviewAm:
      z
        .string()
        .trim()
        .min(5)
        .max(10000),

    challengeEn:
      z
        .string()
        .trim()
        .min(5)
        .max(10000),

    challengeAm:
      z
        .string()
        .trim()
        .min(5)
        .max(10000),

    solutionEn:
      z
        .string()
        .trim()
        .min(5)
        .max(10000),

    solutionAm:
      z
        .string()
        .trim()
        .min(5)
        .max(10000),

    howItWorks:
      z
        .array(
          projectStepSchema,
        )
        .max(12),

    features:
      z
        .array(
          localizedTextSchema,
        )
        .max(30),

    gallery:
      z
        .array(
          galleryInputSchema,
        )
        .max(5),
  });

/* =========================================================
   GALLERY RESOLUTION
   ========================================================= */

async function resolveGallery(
  incoming:
    z.infer<
      typeof galleryInputSchema
    >[],

  existing:
    StoredGalleryImage[] = [],
) {
  const existingByPublicId =
    new Map(
      existing.map(
        (
          image,
        ) => [
          image.publicId,
          image,
        ],
      ),
    );

  const duplicateCheck =
    new Set<string>();

  const resolved:
    StoredGalleryImage[] =
      [];

  for (
    const item
    of incoming
  ) {
    if (
      duplicateCheck.has(
        item.publicId,
      )
    ) {
      throw new Error(
        "DUPLICATE_GALLERY_IMAGE",
      );
    }

    duplicateCheck.add(
      item.publicId,
    );

    const existingImage =
      existingByPublicId.get(
        item.publicId,
      );

    if (
      existingImage
    ) {
      resolved.push({
        publicId:
          existingImage.publicId,

        url:
          existingImage.url,

        altEn:
          item.altEn,

        altAm:
          item.altAm,
      });

      continue;
    }

    const verified =
      await verifyProjectImage(
        item.publicId,
      );

    resolved.push({
      publicId:
        verified.publicId,

      url:
        verified.secureUrl,

      altEn:
        item.altEn,

      altAm:
        item.altAm,
    });
  }

  return resolved;
}

/* =========================================================
   RATE LIMIT
   ========================================================= */

const projectWriteLimiter =
  rateLimit({
    windowMs:
      15 *
      60 *
      1000,

    limit:
      60,

    standardHeaders:
      true,

    legacyHeaders:
      false,
  });

router.use(
  requireAdmin,
);

/* =========================================================
   GET ADMIN PROJECTS
   ========================================================= */

router.get(
  "/",

  async (
    _req,
    res,
  ) => {
    const result =
      await db.query<ProjectRow>(
        `
          SELECT *

          FROM projects

          ORDER BY
            sort_order ASC,
            created_at DESC
        `,
      );

    res.json({
      success:
        true,

      projects:
        result.rows.map(
          mapProject,
        ),
    });
  },
);

/* =========================================================
   CLOUDINARY SIGNATURE
   ========================================================= */

router.post(
  "/upload-signature",

  projectWriteLimiter,

  async (
    _req,
    res,
  ) => {
    const timestamp =
      Math.floor(
        Date.now() /
          1000,
      );

    const parameters = {
      timestamp,

      folder:
        env.CLOUDINARY_PROJECT_FOLDER,

      public_id:
        randomUUID(),
    };

    const signature =
      cloudinary.utils.api_sign_request(
        parameters,

        env.CLOUDINARY_API_SECRET,
      );

    res.json({
      success:
        true,

      uploadUrl:
        `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,

      apiKey:
        env.CLOUDINARY_API_KEY,

      signature,

      parameters,
    });
  },
);

/* =========================================================
   CREATE
   ========================================================= */

router.post(
  "/",

  projectWriteLimiter,

  async (
    req,
    res,
  ) => {
    const parsed =
      projectSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      console.error(
        parsed.error.flatten(),
      );

      errorResponse(
        res,
        400,
        "INVALID_PROJECT",
        "Check all project information and try again.",
        "የፕሮጀክቱን መረጃ ያረጋግጡ እና እንደገና ይሞክሩ።",
      );

      return;
    }

    if (!req.auth) {
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

    let cover:
      VerifiedProjectImage;

    let gallery:
      StoredGalleryImage[];

    try {
      cover =
        await verifyProjectImage(
          data.coverImagePublicId,
        );

      gallery =
        await resolveGallery(
          data.gallery,
        );
    } catch {
      errorResponse(
        res,
        400,
        "INVALID_PROJECT_IMAGE",
        "One or more project images are invalid.",
        "ከፕሮጀክቱ ምስሎች አንዱ ወይም ከዚያ በላይ ትክክል አይደለም።",
      );

      return;
    }

    const uploadedPublicIds =
      [
        cover.publicId,

        ...gallery.map(
          (
            image,
          ) =>
            image.publicId,
        ),
      ];

    try {
      const result =
        await db.query<ProjectRow>(
          `
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

              created_by,

              project_year,

              role_en,
              role_am,

              display_status_en,
              display_status_am,

              overview_en,
              overview_am,

              challenge_en,
              challenge_am,

              solution_en,
              solution_am,

              how_it_works,
              features,
              gallery
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
              $17,
              $18,
              $19,
              $20,
              $21,
              $22,
              $23,
              $24,
              $25,
              $26,
              $27,
              $28,
              $29::JSONB,
              $30::JSONB,
              $31::JSONB
            )

            RETURNING *
          `,
          [
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

            cover.secureUrl,
            cover.publicId,

            data.liveUrl ||
              null,

            data.status,

            data.featured,

            data.sortOrder,

            req.auth.id,

            data.projectYear,

            data.roleEn,
            data.roleAm,

            data.displayStatusEn,
            data.displayStatusAm,

            data.overviewEn,
            data.overviewAm,

            data.challengeEn,
            data.challengeAm,

            data.solutionEn,
            data.solutionAm,

            JSON.stringify(
              data.howItWorks,
            ),

            JSON.stringify(
              data.features,
            ),

            JSON.stringify(
              gallery,
            ),
          ],
        );

      const project =
        result.rows[0];

      if (!project) {
        await safelyDeleteImages(
          uploadedPublicIds,
        );

        errorResponse(
          res,
          500,
          "CREATE_FAILED",
          "Project could not be created.",
          "ፕሮጀክቱን መፍጠር አልተቻለም።",
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

          project:
            mapProject(
              project,
            ),
        });
    } catch (
      error:
        unknown
    ) {
      await safelyDeleteImages(
        uploadedPublicIds,
      );

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
          "SLUG_EXISTS",
          "A project with this slug already exists.",
          "በዚህ slug የተመዘገበ ፕሮጀክት አለ።",
        );

        return;
      }

      throw error;
    }
  },
);

/* =========================================================
   UPDATE
   ========================================================= */

router.patch(
  "/:id",

  projectWriteLimiter,

  async (
    req,
    res,
  ) => {
    const parsed =
      projectSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      console.error(
        parsed.error.flatten(),
      );

      errorResponse(
        res,
        400,
        "INVALID_PROJECT",
        "Check all project information and try again.",
        "የፕሮጀክቱን መረጃ ያረጋግጡ እና እንደገና ይሞክሩ።",
      );

      return;
    }

    const existingResult =
      await db.query<{
        cover_image_public_id:
          string;

        cover_image_url:
          string;

        gallery:
          unknown;
      }>(
        `
          SELECT
            cover_image_public_id,
            cover_image_url,
            gallery

          FROM projects

          WHERE id = $1

          LIMIT 1
        `,
        [
          req.params.id,
        ],
      );

    const existing =
      existingResult.rows[0];

    if (!existing) {
      errorResponse(
        res,
        404,
        "PROJECT_NOT_FOUND",
        "Project not found.",
        "ፕሮጀክቱ አልተገኘም።",
      );

      return;
    }

    const data =
      parsed.data;

    const existingGallery =
      normalizeGallery(
        existing.gallery,
      );

    let cover:
      VerifiedProjectImage;

    let gallery:
      StoredGalleryImage[];

    try {
      if (
        data.coverImagePublicId ===
        existing.cover_image_public_id
      ) {
        cover = {
          publicId:
            existing.cover_image_public_id,

          secureUrl:
            existing.cover_image_url,
        };
      } else {
        cover =
          await verifyProjectImage(
            data.coverImagePublicId,
          );
      }

      gallery =
        await resolveGallery(
          data.gallery,

          existingGallery,
        );
    } catch {
      errorResponse(
        res,
        400,
        "INVALID_PROJECT_IMAGE",
        "One or more project images are invalid.",
        "ከፕሮጀክቱ ምስሎች አንዱ ወይም ከዚያ በላይ ትክክል አይደለም።",
      );

      return;
    }

    const oldPublicIds =
      new Set([
        existing.cover_image_public_id,

        ...existingGallery.map(
          (
            image,
          ) =>
            image.publicId,
        ),
      ]);

    const newPublicIds =
      new Set([
        cover.publicId,

        ...gallery.map(
          (
            image,
          ) =>
            image.publicId,
        ),
      ]);

    const newlyUploaded =
      [
        ...newPublicIds,
      ].filter(
        (
          publicId,
        ) =>
          !oldPublicIds.has(
            publicId,
          ),
      );

    const removedImages =
      [
        ...oldPublicIds,
      ].filter(
        (
          publicId,
        ) =>
          !newPublicIds.has(
            publicId,
          ),
      );

    try {
      const result =
        await db.query<ProjectRow>(
          `
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

              project_year = $17,

              role_en = $18,
              role_am = $19,

              display_status_en = $20,
              display_status_am = $21,

              overview_en = $22,
              overview_am = $23,

              challenge_en = $24,
              challenge_am = $25,

              solution_en = $26,
              solution_am = $27,

              how_it_works = $28::JSONB,

              features = $29::JSONB,

              gallery = $30::JSONB,

              updated_at = NOW()

            WHERE id = $31

            RETURNING *
          `,
          [
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

            cover.secureUrl,
            cover.publicId,

            data.liveUrl ||
              null,

            data.status,

            data.featured,

            data.sortOrder,

            data.projectYear,

            data.roleEn,
            data.roleAm,

            data.displayStatusEn,
            data.displayStatusAm,

            data.overviewEn,
            data.overviewAm,

            data.challengeEn,
            data.challengeAm,

            data.solutionEn,
            data.solutionAm,

            JSON.stringify(
              data.howItWorks,
            ),

            JSON.stringify(
              data.features,
            ),

            JSON.stringify(
              gallery,
            ),

            req.params.id,
          ],
        );

      const project =
        result.rows[0];

      if (!project) {
        await safelyDeleteImages(
          newlyUploaded,
        );

        errorResponse(
          res,
          404,
          "PROJECT_NOT_FOUND",
          "Project not found.",
          "ፕሮጀክቱ አልተገኘም።",
        );

        return;
      }

      await safelyDeleteImages(
        removedImages,
      );

      res.json({
        success:
          true,

        project:
          mapProject(
            project,
          ),
      });
    } catch (
      error:
        unknown
    ) {
      await safelyDeleteImages(
        newlyUploaded,
      );

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
          "SLUG_EXISTS",
          "A project with this slug already exists.",
          "በዚህ slug የተመዘገበ ፕሮጀክት አለ።",
        );

        return;
      }

      throw error;
    }
  },
);

/* =========================================================
   DELETE
   ========================================================= */

router.delete(
  "/:id",

  projectWriteLimiter,

  async (
    req,
    res,
  ) => {
    const result =
      await db.query<{
        cover_image_public_id:
          string;

        gallery:
          unknown;
      }>(
        `
          DELETE FROM projects

          WHERE id = $1

          RETURNING
            cover_image_public_id,
            gallery
        `,
        [
          req.params.id,
        ],
      );

    const project =
      result.rows[0];

    if (!project) {
      errorResponse(
        res,
        404,
        "PROJECT_NOT_FOUND",
        "Project not found.",
        "ፕሮጀክቱ አልተገኘም።",
      );

      return;
    }

    const gallery =
      normalizeGallery(
        project.gallery,
      );

    await safelyDeleteImages([
      project.cover_image_public_id,

      ...gallery.map(
        (
          image,
        ) =>
          image.publicId,
      ),
    ]);

    res.json({
      success:
        true,

      message: {
        en:
          "Project deleted successfully.",

        am:
          "ፕሮጀክቱ ተሰርዟል።",
      },
    });
  },
);

export default router;
