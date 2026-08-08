import {
  Router,
} from "express";

import {
  db,
} from "../config/db.js";

const router =
  Router();

/* =========================================================
   TYPES
   ========================================================= */

type LocalizedText = {
  en:
    string;

  am:
    string;
};

type ProjectStep = {
  title:
    LocalizedText;

  description:
    LocalizedText;
};

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

/* =========================================================
   NORMALIZERS
   ========================================================= */

function normalizeLocalizedTextArray(
  value:
    unknown,
): LocalizedText[] {
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
        item as {
          en?:
            unknown;

          am?:
            unknown;
        };

      if (
        typeof candidate.en !==
          "string" ||
        typeof candidate.am !==
          "string"
      ) {
        return [];
      }

      return [
        {
          en:
            candidate.en,

          am:
            candidate.am,
        },
      ];
    },
  );
}

function normalizeHowItWorks(
  value:
    unknown,
): ProjectStep[] {
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
        item as {
          title?:
            unknown;

          description?:
            unknown;
        };

      if (
        typeof candidate.title !==
          "object" ||
        candidate.title ===
          null ||
        typeof candidate.description !==
          "object" ||
        candidate.description ===
          null
      ) {
        return [];
      }

      const title =
        candidate.title as {
          en?:
            unknown;

          am?:
            unknown;
        };

      const description =
        candidate.description as {
          en?:
            unknown;

          am?:
            unknown;
        };

      if (
        typeof title.en !==
          "string" ||
        typeof title.am !==
          "string" ||
        typeof description.en !==
          "string" ||
        typeof description.am !==
          "string"
      ) {
        return [];
      }

      return [
        {
          title: {
            en:
              title.en,

            am:
              title.am,
          },

          description: {
            en:
              description.en,

            am:
              description.am,
          },
        },
      ];
    },
  );
}

function normalizeGallery(
  value:
    unknown,
) {
  if (
    !Array.isArray(
      value,
    )
  ) {
    return [];
  }

  return value
    .slice(
      0,
      5,
    )
    .flatMap(
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
          typeof candidate.url !==
            "string" ||
          !candidate.url ||
          typeof candidate.publicId !==
            "string" ||
          !candidate.publicId
        ) {
          return [];
        }

        return [
          {
            url:
              candidate.url,

            publicId:
              candidate.publicId,

            alt: {
              en:
                typeof candidate.altEn ===
                  "string"
                  ? candidate.altEn
                  : "",

              am:
                typeof candidate.altAm ===
                  "string"
                  ? candidate.altAm
                  : "",
            },
          },
        ];
      },
    );
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

    title: {
      en:
        project.title_en,

      am:
        project.title_am,
    },

    thumbnail:
      project.cover_image_url,

    category: {
      en:
        project.category_en,

      am:
        project.category_am,
    },

    shortDescription: {
      en:
        project.short_description_en,

      am:
        project.short_description_am,
    },

    description: {
      en:
        project.description_en,

      am:
        project.description_am,
    },

    technologies:
      project.technologies,

    liveUrl:
      project.live_url,

    featured:
      project.featured,

    sortOrder:
      project.sort_order,

    year:
      project.project_year,

    role: {
      en:
        project.role_en,

      am:
        project.role_am,
    },

    status: {
      en:
        project.display_status_en,

      am:
        project.display_status_am,
    },

    overview: {
      en:
        project.overview_en,

      am:
        project.overview_am,
    },

    challenge: {
      en:
        project.challenge_en,

      am:
        project.challenge_am,
    },

    solution: {
      en:
        project.solution_en,

      am:
        project.solution_am,
    },

    howItWorks:
      normalizeHowItWorks(
        project.how_it_works,
      ),

    features:
      normalizeLocalizedTextArray(
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
   COLUMN LIST
   ========================================================= */

const PROJECT_COLUMNS = `
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

  live_url,

  status,
  featured,
  sort_order,

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
  gallery,

  created_at,
  updated_at
`;

/* =========================================================
   ALL PUBLISHED
   ========================================================= */

router.get(
  "/",

  async (
    req,
    res,
  ) => {
    const featuredOnly =
      req.query.featured ===
      "true";

    const result =
      await db.query<ProjectRow>(
        `
          SELECT
            ${PROJECT_COLUMNS}

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
        `,
        [
          featuredOnly,
        ],
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
   PROJECT BY SLUG
   ========================================================= */

router.get(
  "/:slug",

  async (
    req,
    res,
  ) => {
    const result =
      await db.query<ProjectRow>(
        `
          SELECT
            ${PROJECT_COLUMNS}

          FROM projects

          WHERE
            LOWER(slug) =
              LOWER($1)

            AND status =
              'published'

          LIMIT 1
        `,
        [
          req.params.slug,
        ],
      );

    const project =
      result.rows[0];

    if (!project) {
      res
        .status(
          404,
        )
        .json({
          success:
            false,

          message: {
            en:
              "Project not found.",

            am:
              "ፕሮጀክቱ አልተገኘም።",
          },
        });

      return;
    }

    res.json({
      success:
        true,

      project:
        mapProject(
          project,
        ),
    });
  },
);

export default router;