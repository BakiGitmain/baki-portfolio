import { randomUUID } from "node:crypto";

import { Router, type Response } from "express";
import { rateLimit } from "../middleware/rate-limit.middleware.js";
import { z } from "zod";

import { cloudinary } from "../config/cloudinary.js";
import { db } from "../config/db.js";
import { env } from "../config/env.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

const TRAINING_VIDEO_FOLDER = `${env.CLOUDINARY_PROJECT_FOLDER}/training`;
const MAX_TRAINING_VIDEO_BYTES = 100 * 1024 * 1024;

const ALLOWED_TRAINING_VIDEO_FORMATS = new Set([
  "mp4",
  "webm",
  "mov",
  "m4v",
]);

const writeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 180,
});

const uploadSignatureRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
});

type CourseStatus = "draft" | "published";

type CourseRow = {
  id: string;
  slug: string;
  title_en: string;
  title_am: string;
  description_en: string;
  description_am: string;
  status: CourseStatus;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
};

type SectionRow = {
  id: string;
  course_id: string;
  title_en: string;
  title_am: string;
  description_en: string;
  description_am: string;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
};

type LessonRow = {
  id: string;
  section_id: string;
  title_en: string;
  title_am: string;
  summary_en: string;
  summary_am: string;
  notes_en: string;
  notes_am: string;
  video_url: string | null;
  video_public_id: string | null;
  duration_seconds: number;
  sort_order: number;
  is_preview: boolean;
  created_at: Date;
  updated_at: Date;
};

type ResourceRow = {
  id: string;
  lesson_id: string;
  label_en: string;
  label_am: string;
  url: string;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
};

type VerifiedTrainingVideo = {
  publicId: string;
  secureUrl: string;
  durationSeconds: number;
};

type RouteParamValue =
  | string
  | string[]
  | undefined;

function errorResponse(
  res: Response,
  status: number,
  code: string,
  en: string,
  am: string,
) {
  return res.status(status).json({
    success: false,
    code,
    message: {
      en,
      am,
    },
  });
}

function mapResource(
  resource: ResourceRow,
) {
  return {
    id: resource.id,

    lessonId:
      resource.lesson_id,

    labelEn:
      resource.label_en,

    labelAm:
      resource.label_am,

    url:
      resource.url,

    sortOrder:
      resource.sort_order,

    createdAt:
      resource.created_at,

    updatedAt:
      resource.updated_at,
  };
}

function mapLesson(
  lesson: LessonRow,
  resources:
    ResourceRow[] = [],
) {
  return {
    id:
      lesson.id,

    sectionId:
      lesson.section_id,

    titleEn:
      lesson.title_en,

    titleAm:
      lesson.title_am,

    summaryEn:
      lesson.summary_en,

    summaryAm:
      lesson.summary_am,

    notesEn:
      lesson.notes_en,

    notesAm:
      lesson.notes_am,

    videoUrl:
      lesson.video_url,

    videoPublicId:
      lesson.video_public_id,

    durationSeconds:
      lesson.duration_seconds,

    sortOrder:
      lesson.sort_order,

    isPreview:
      lesson.is_preview,

    resources:
      resources.map(
        mapResource,
      ),

    createdAt:
      lesson.created_at,

    updatedAt:
      lesson.updated_at,
  };
}

function mapSection(
  section: SectionRow,

  lessons: Array<
    ReturnType<
      typeof mapLesson
    >
  > = [],
) {
  return {
    id:
      section.id,

    courseId:
      section.course_id,

    titleEn:
      section.title_en,

    titleAm:
      section.title_am,

    descriptionEn:
      section.description_en,

    descriptionAm:
      section.description_am,

    sortOrder:
      section.sort_order,

    lessons,

    createdAt:
      section.created_at,

    updatedAt:
      section.updated_at,
  };
}

function mapCourse(
  course: CourseRow,

  sections: Array<
    ReturnType<
      typeof mapSection
    >
  > = [],
) {
  return {
    id:
      course.id,

    slug:
      course.slug,

    titleEn:
      course.title_en,

    titleAm:
      course.title_am,

    descriptionEn:
      course.description_en,

    descriptionAm:
      course.description_am,

    status:
      course.status,

    sortOrder:
      course.sort_order,

    sections,

    createdAt:
      course.created_at,

    updatedAt:
      course.updated_at,
  };
}

function isDatabaseError(
  error: unknown,
  code: string,
) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (
      error as {
        code?: unknown;
      }
    ).code === code
  );
}

async function safelyDeleteTrainingVideo(
  publicId:
    | string
    | null
    | undefined,
) {
  if (
    !publicId ||
    !publicId.startsWith(
      `${TRAINING_VIDEO_FOLDER}/`,
    )
  ) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type:
          "video",

        invalidate:
          true,
      },
    );
  } catch (
    error
  ) {
    console.error(
      "Training video cleanup failed:",
      error,
    );
  }
}

async function safelyDeleteTrainingVideos(
  publicIds: string[],
) {
  const uniqueIds = [
    ...new Set(
      publicIds.filter(
        Boolean,
      ),
    ),
  ];

  await Promise.allSettled(
    uniqueIds.map(
      (
        publicId,
      ) =>
        safelyDeleteTrainingVideo(
          publicId,
        ),
    ),
  );
}

async function verifyTrainingVideo(
  publicId: string,
): Promise<VerifiedTrainingVideo> {
  if (
    !publicId.startsWith(
      `${TRAINING_VIDEO_FOLDER}/`,
    )
  ) {
    throw new Error(
      "INVALID_TRAINING_VIDEO",
    );
  }

  try {
    const resource =
      await cloudinary.api.resource(
        publicId,
        {
          resource_type:
            "video",
        },
      );

    const format =
      String(
        resource.format ??
          "",
      ).toLowerCase();

    const bytes =
      Number(
        resource.bytes ??
          0,
      );

    const duration =
      Number(
        resource.duration ??
          0,
      );

    if (
      resource.resource_type !==
        "video" ||
      !ALLOWED_TRAINING_VIDEO_FORMATS.has(
        format,
      ) ||
      bytes <= 0 ||
      bytes >
        MAX_TRAINING_VIDEO_BYTES ||
      typeof resource.secure_url !==
        "string" ||
      !resource.secure_url ||
      typeof resource.public_id !==
        "string" ||
      !resource.public_id
    ) {
      throw new Error(
        "INVALID_TRAINING_VIDEO",
      );
    }

    return {
      publicId:
        resource.public_id,

      secureUrl:
        resource.secure_url,

      durationSeconds:
        Number.isFinite(
          duration,
        ) &&
        duration > 0
          ? Math.round(
              duration,
            )
          : 0,
    };
  } catch (
    error
  ) {
    if (
      error instanceof
        Error &&
      error.message ===
        "INVALID_TRAINING_VIDEO"
    ) {
      throw error;
    }

    throw new Error(
      "INVALID_TRAINING_VIDEO",
    );
  }
}

const uuidSchema =
  z
    .string()
    .uuid();

const statusSchema =
  z.enum([
    "draft",
    "published",
  ]);

const requiredTitle =
  z
    .string()
    .trim()
    .min(1)
    .max(220);

const optionalText = (
  max: number,
) =>
  z
    .string()
    .trim()
    .max(max)
    .default("");

const sortOrderSchema =
  z
    .number()
    .int()
    .min(0)
    .max(100000)
    .default(0);

const optionalUrlSchema =
  z.union([
    z.literal(""),

    z
      .string()
      .trim()
      .url()
      .max(4000),
  ]);

const courseInputSchema =
  z
    .object({
      slug:
        z
          .string()
          .trim()
          .min(1)
          .max(160)
          .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          ),

      titleEn:
        requiredTitle,

      titleAm:
        requiredTitle,

      descriptionEn:
        optionalText(
          10000,
        ),

      descriptionAm:
        optionalText(
          10000,
        ),

      status:
        statusSchema.default(
          "draft",
        ),

      sortOrder:
        sortOrderSchema,
    })
    .strict();

const sectionInputSchema =
  z
    .object({
      titleEn:
        requiredTitle,

      titleAm:
        requiredTitle,

      descriptionEn:
        optionalText(
          5000,
        ),

      descriptionAm:
        optionalText(
          5000,
        ),

      sortOrder:
        sortOrderSchema,
    })
    .strict();

const lessonInputSchema =
  z
    .object({
      titleEn:
        requiredTitle,

      titleAm:
        requiredTitle,

      summaryEn:
        optionalText(
          5000,
        ),

      summaryAm:
        optionalText(
          5000,
        ),

      notesEn:
        optionalText(
          30000,
        ),

      notesAm:
        optionalText(
          30000,
        ),

      videoUrl:
        optionalUrlSchema.default(
          "",
        ),

      videoPublicId:
        z
          .string()
          .trim()
          .max(500)
          .default(""),

      durationSeconds:
        z
          .number()
          .int()
          .min(0)
          .max(
            24 *
              60 *
              60,
          )
          .default(0),

      sortOrder:
        sortOrderSchema,

      isPreview:
        z
          .boolean()
          .default(false),
    })
    .strict();

const resourceInputSchema =
  z
    .object({
      labelEn:
        requiredTitle,

      labelAm:
        requiredTitle,

      url:
        z
          .string()
          .trim()
          .url()
          .max(4000),

      sortOrder:
        sortOrderSchema,
    })
    .strict();

/* =========================================================
   ROUTE PARAM FIX

   Express 5 route params can be
   string | string[].

   We normalize them here before
   sending them to Zod.
   ========================================================= */

function getUuidParam(
  value:
    RouteParamValue,

  res:
    Response,
) {
  const normalizedValue =
    Array.isArray(
      value,
    )
      ? value.length ===
        1
        ? value[0]
        : undefined
      : value;

  const result =
    uuidSchema.safeParse(
      normalizedValue,
    );

  if (
    !result.success
  ) {
    errorResponse(
      res,
      400,
      "INVALID_ID",
      "The requested training item has an invalid ID.",
      "የተጠየቀው training item ID ትክክል አይደለም።",
    );

    return null;
  }

  return result.data;
}

function invalidBody(
  res:
    Response,
) {
  return errorResponse(
    res,
    400,
    "INVALID_TRAINING_DATA",
    "Check the training fields and try again.",
    "የtraining መረጃዎቹን ያረጋግጡ እና እንደገና ይሞክሩ።",
  );
}

router.use(
  requireAdmin,
);

/* =========================================================
   VIDEO UPLOAD SIGNATURE
   ========================================================= */

router.post(
  "/video-upload-signature",

  uploadSignatureRateLimit,

  async (
    _req,
    res,
    next,
  ) => {
    try {
      const timestamp =
        Math.floor(
          Date.now() /
            1000,
        );

      const parameters = {
        timestamp,

        folder:
          TRAINING_VIDEO_FOLDER,

        public_id:
          randomUUID(),
      };

      const signature =
        cloudinary.utils.api_sign_request(
          parameters,
          env.CLOUDINARY_API_SECRET,
        );

      return res.json({
        success:
          true,

        uploadUrl:
          `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/video/upload`,

        apiKey:
          env.CLOUDINARY_API_KEY,

        signature,

        parameters,
      });
    } catch (
      error
    ) {
      next(
        error,
      );
    }
  },
);

/* =========================================================
   GET ALL COURSES
   ========================================================= */

router.get(
  "/courses",

  async (
    _req,
    res,
    next,
  ) => {
    try {
      const [
        courseResult,
        sectionResult,
        lessonResult,
        resourceResult,
      ] =
        await Promise.all([
          db.query<CourseRow>(
            `
              SELECT *
              FROM training_courses
              ORDER BY
                sort_order ASC,
                created_at ASC
            `,
          ),

          db.query<SectionRow>(
            `
              SELECT *
              FROM training_sections
              ORDER BY
                course_id ASC,
                sort_order ASC,
                created_at ASC
            `,
          ),

          db.query<LessonRow>(
            `
              SELECT *
              FROM training_lessons
              ORDER BY
                section_id ASC,
                sort_order ASC,
                created_at ASC
            `,
          ),

          db.query<ResourceRow>(
            `
              SELECT *
              FROM training_lesson_resources
              ORDER BY
                lesson_id ASC,
                sort_order ASC,
                created_at ASC
            `,
          ),
        ]);

      const resourcesByLesson =
        new Map<
          string,
          ResourceRow[]
        >();

      for (
        const resource of
        resourceResult.rows
      ) {
        const current =
          resourcesByLesson.get(
            resource.lesson_id,
          ) ??
          [];

        current.push(
          resource,
        );

        resourcesByLesson.set(
          resource.lesson_id,
          current,
        );
      }

      const lessonsBySection =
        new Map<
          string,
          Array<
            ReturnType<
              typeof mapLesson
            >
          >
        >();

      for (
        const lesson of
        lessonResult.rows
      ) {
        const current =
          lessonsBySection.get(
            lesson.section_id,
          ) ??
          [];

        current.push(
          mapLesson(
            lesson,

            resourcesByLesson.get(
              lesson.id,
            ) ??
              [],
          ),
        );

        lessonsBySection.set(
          lesson.section_id,
          current,
        );
      }

      const sectionsByCourse =
        new Map<
          string,
          Array<
            ReturnType<
              typeof mapSection
            >
          >
        >();

      for (
        const section of
        sectionResult.rows
      ) {
        const current =
          sectionsByCourse.get(
            section.course_id,
          ) ??
          [];

        current.push(
          mapSection(
            section,

            lessonsBySection.get(
              section.id,
            ) ??
              [],
          ),
        );

        sectionsByCourse.set(
          section.course_id,
          current,
        );
      }

      return res.json({
        success:
          true,

        courses:
          courseResult.rows.map(
            (
              course,
            ) =>
              mapCourse(
                course,

                sectionsByCourse.get(
                  course.id,
                ) ??
                  [],
              ),
          ),
      });
    } catch (
      error
    ) {
      next(
        error,
      );
    }
  },
);

/* =========================================================
   CREATE COURSE
   ========================================================= */

router.post(
  "/courses",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    const parsed =
      courseInputSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      return invalidBody(
        res,
      );
    }

    const input =
      parsed.data;

    try {
      const result =
        await db.query<CourseRow>(
          `
            INSERT INTO training_courses (
              slug,
              title_en,
              title_am,
              description_en,
              description_am,
              status,
              sort_order
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7
            )
            RETURNING *
          `,
          [
            input.slug,
            input.titleEn,
            input.titleAm,
            input.descriptionEn,
            input.descriptionAm,
            input.status,
            input.sortOrder,
          ],
        );

      const course =
        result.rows[0];

      if (
        !course
      ) {
        return errorResponse(
          res,
          500,
          "COURSE_CREATE_FAILED",
          "The course could not be created.",
          "Course መፍጠር አልተቻለም።",
        );
      }

      return res
        .status(201)
        .json({
          success:
            true,

          course:
            mapCourse(
              course,
            ),
        });
    } catch (
      error
    ) {
      if (
        isDatabaseError(
          error,
          "23505",
        )
      ) {
        return errorResponse(
          res,
          409,
          "COURSE_SLUG_EXISTS",
          "A course with that slug already exists.",
          "ይህ slug ያለው course አስቀድሞ አለ።",
        );
      }

      next(
        error,
      );
    }
  },
);

/* =========================================================
   UPDATE COURSE
   ========================================================= */

router.patch(
  "/courses/:courseId",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    const courseId =
      getUuidParam(
        req.params.courseId,
        res,
      );

    if (
      !courseId
    ) {
      return;
    }

    const parsed =
      courseInputSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      return invalidBody(
        res,
      );
    }

    const input =
      parsed.data;

    try {
      const result =
        await db.query<CourseRow>(
          `
            UPDATE training_courses
            SET
              slug = $2,
              title_en = $3,
              title_am = $4,
              description_en = $5,
              description_am = $6,
              status = $7,
              sort_order = $8,
              updated_at = NOW()
            WHERE id = $1
            RETURNING *
          `,
          [
            courseId,
            input.slug,
            input.titleEn,
            input.titleAm,
            input.descriptionEn,
            input.descriptionAm,
            input.status,
            input.sortOrder,
          ],
        );

      const course =
        result.rows[0];

      if (
        !course
      ) {
        return errorResponse(
          res,
          404,
          "COURSE_NOT_FOUND",
          "Course not found.",
          "Course አልተገኘም።",
        );
      }

      return res.json({
        success:
          true,

        course:
          mapCourse(
            course,
          ),
      });
    } catch (
      error
    ) {
      if (
        isDatabaseError(
          error,
          "23505",
        )
      ) {
        return errorResponse(
          res,
          409,
          "COURSE_SLUG_EXISTS",
          "A course with that slug already exists.",
          "ይህ slug ያለው course አስቀድሞ አለ።",
        );
      }

      next(
        error,
      );
    }
  },
);

/* =========================================================
   DELETE COURSE
   ========================================================= */

router.delete(
  "/courses/:courseId",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    const courseId =
      getUuidParam(
        req.params.courseId,
        res,
      );

    if (
      !courseId
    ) {
      return;
    }

    try {
      const videoResult =
        await db.query<{
          video_public_id:
            string | null;
        }>(
          `
            SELECT
              l.video_public_id
            FROM training_lessons l
            INNER JOIN training_sections s
              ON s.id = l.section_id
            WHERE
              s.course_id = $1
              AND l.video_public_id IS NOT NULL
          `,
          [
            courseId,
          ],
        );

      const result =
        await db.query<{
          id:
            string;
        }>(
          `
            DELETE FROM training_courses
            WHERE id = $1
            RETURNING id
          `,
          [
            courseId,
          ],
        );

      if (
        !result.rows[0]
      ) {
        return errorResponse(
          res,
          404,
          "COURSE_NOT_FOUND",
          "Course not found.",
          "Course አልተገኘም።",
        );
      }

      await safelyDeleteTrainingVideos(
        videoResult.rows.flatMap(
          (
            row,
          ) =>
            row.video_public_id
              ? [
                  row.video_public_id,
                ]
              : [],
        ),
      );

      return res.json({
        success:
          true,
      });
    } catch (
      error
    ) {
      next(
        error,
      );
    }
  },
);

/* =========================================================
   CREATE SECTION
   ========================================================= */

router.post(
  "/courses/:courseId/sections",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    const courseId =
      getUuidParam(
        req.params.courseId,
        res,
      );

    if (
      !courseId
    ) {
      return;
    }

    const parsed =
      sectionInputSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      return invalidBody(
        res,
      );
    }

    const input =
      parsed.data;

    try {
      const result =
        await db.query<SectionRow>(
          `
            INSERT INTO training_sections (
              course_id,
              title_en,
              title_am,
              description_en,
              description_am,
              sort_order
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6
            )
            RETURNING *
          `,
          [
            courseId,
            input.titleEn,
            input.titleAm,
            input.descriptionEn,
            input.descriptionAm,
            input.sortOrder,
          ],
        );

      const section =
        result.rows[0];

      if (
        !section
      ) {
        return errorResponse(
          res,
          500,
          "SECTION_CREATE_FAILED",
          "The section could not be created.",
          "Section መፍጠር አልተቻለም።",
        );
      }

      return res
        .status(201)
        .json({
          success:
            true,

          section:
            mapSection(
              section,
            ),
        });
    } catch (
      error
    ) {
      if (
        isDatabaseError(
          error,
          "23503",
        )
      ) {
        return errorResponse(
          res,
          404,
          "COURSE_NOT_FOUND",
          "Course not found.",
          "Course አልተገኘም።",
        );
      }

      next(
        error,
      );
    }
  },
);

/* =========================================================
   UPDATE SECTION
   ========================================================= */

router.patch(
  "/sections/:sectionId",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    const sectionId =
      getUuidParam(
        req.params.sectionId,
        res,
      );

    if (
      !sectionId
    ) {
      return;
    }

    const parsed =
      sectionInputSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      return invalidBody(
        res,
      );
    }

    const input =
      parsed.data;

    try {
      const result =
        await db.query<SectionRow>(
          `
            UPDATE training_sections
            SET
              title_en = $2,
              title_am = $3,
              description_en = $4,
              description_am = $5,
              sort_order = $6,
              updated_at = NOW()
            WHERE id = $1
            RETURNING *
          `,
          [
            sectionId,
            input.titleEn,
            input.titleAm,
            input.descriptionEn,
            input.descriptionAm,
            input.sortOrder,
          ],
        );

      const section =
        result.rows[0];

      if (
        !section
      ) {
        return errorResponse(
          res,
          404,
          "SECTION_NOT_FOUND",
          "Section not found.",
          "Section አልተገኘም።",
        );
      }

      return res.json({
        success:
          true,

        section:
          mapSection(
            section,
          ),
      });
    } catch (
      error
    ) {
      next(
        error,
      );
    }
  },
);

/* =========================================================
   DELETE SECTION
   ========================================================= */

router.delete(
  "/sections/:sectionId",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    const sectionId =
      getUuidParam(
        req.params.sectionId,
        res,
      );

    if (
      !sectionId
    ) {
      return;
    }

    try {
      const videoResult =
        await db.query<{
          video_public_id:
            string | null;
        }>(
          `
            SELECT
              video_public_id
            FROM training_lessons
            WHERE
              section_id = $1
              AND video_public_id IS NOT NULL
          `,
          [
            sectionId,
          ],
        );

      const result =
        await db.query<{
          id:
            string;
        }>(
          `
            DELETE FROM training_sections
            WHERE id = $1
            RETURNING id
          `,
          [
            sectionId,
          ],
        );

      if (
        !result.rows[0]
      ) {
        return errorResponse(
          res,
          404,
          "SECTION_NOT_FOUND",
          "Section not found.",
          "Section አልተገኘም።",
        );
      }

      await safelyDeleteTrainingVideos(
        videoResult.rows.flatMap(
          (
            row,
          ) =>
            row.video_public_id
              ? [
                  row.video_public_id,
                ]
              : [],
        ),
      );

      return res.json({
        success:
          true,
      });
    } catch (
      error
    ) {
      next(
        error,
      );
    }
  },
);

async function resolveLessonVideo(
  videoPublicId:
    string,

  videoUrl:
    string,

  durationSeconds:
    number,
) {
  if (
    videoPublicId
  ) {
    const verified =
      await verifyTrainingVideo(
        videoPublicId,
      );

    return {
      videoUrl:
        verified.secureUrl,

      videoPublicId:
        verified.publicId,

      durationSeconds:
        verified.durationSeconds ||
        durationSeconds,

      verified,
    };
  }

  return {
    videoUrl:
      videoUrl ||
      null,

    videoPublicId:
      null,

    durationSeconds,

    verified:
      null as
        VerifiedTrainingVideo |
        null,
  };
}

/* =========================================================
   CREATE LESSON
   ========================================================= */

router.post(
  "/sections/:sectionId/lessons",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    const sectionId =
      getUuidParam(
        req.params.sectionId,
        res,
      );

    if (
      !sectionId
    ) {
      return;
    }

    const parsed =
      lessonInputSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      return invalidBody(
        res,
      );
    }

    const input =
      parsed.data;

    let resolvedVideo:
      | Awaited<
          ReturnType<
            typeof resolveLessonVideo
          >
        >
      | null =
      null;

    try {
      resolvedVideo =
        await resolveLessonVideo(
          input.videoPublicId,
          input.videoUrl,
          input.durationSeconds,
        );

      const result =
        await db.query<LessonRow>(
          `
            INSERT INTO training_lessons (
              section_id,
              title_en,
              title_am,
              summary_en,
              summary_am,
              notes_en,
              notes_am,
              video_url,
              video_public_id,
              duration_seconds,
              sort_order,
              is_preview
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
              $12
            )
            RETURNING *
          `,
          [
            sectionId,
            input.titleEn,
            input.titleAm,
            input.summaryEn,
            input.summaryAm,
            input.notesEn,
            input.notesAm,
            resolvedVideo.videoUrl,
            resolvedVideo.videoPublicId,
            resolvedVideo.durationSeconds,
            input.sortOrder,
            input.isPreview,
          ],
        );

      const lesson =
        result.rows[0];

      if (
        !lesson
      ) {
        if (
          resolvedVideo
            .verified
        ) {
          await safelyDeleteTrainingVideo(
            resolvedVideo
              .verified
              .publicId,
          );
        }

        return errorResponse(
          res,
          500,
          "LESSON_CREATE_FAILED",
          "The lesson could not be created.",
          "Lesson መፍጠር አልተቻለም።",
        );
      }

      return res
        .status(201)
        .json({
          success:
            true,

          lesson:
            mapLesson(
              lesson,
            ),
        });
    } catch (
      error
    ) {
      if (
        resolvedVideo?.verified
      ) {
        await safelyDeleteTrainingVideo(
          resolvedVideo
            .verified
            .publicId,
        );
      }

      if (
        error instanceof
          Error &&
        error.message ===
          "INVALID_TRAINING_VIDEO"
      ) {
        return errorResponse(
          res,
          400,
          "INVALID_TRAINING_VIDEO",
          "The uploaded training video is invalid, unsupported, or too large.",
          "የተጫነው training video ትክክል አይደለም፣ አይደገፍም ወይም በጣም ትልቅ ነው።",
        );
      }

      if (
        isDatabaseError(
          error,
          "23503",
        )
      ) {
        return errorResponse(
          res,
          404,
          "SECTION_NOT_FOUND",
          "Section not found.",
          "Section አልተገኘም።",
        );
      }

      next(
        error,
      );
    }
  },
);

/* =========================================================
   UPDATE LESSON
   ========================================================= */

router.patch(
  "/lessons/:lessonId",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    const lessonId =
      getUuidParam(
        req.params.lessonId,
        res,
      );

    if (
      !lessonId
    ) {
      return;
    }

    const parsed =
      lessonInputSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      return invalidBody(
        res,
      );
    }

    const input =
      parsed.data;

    let resolvedVideo:
      | Awaited<
          ReturnType<
            typeof resolveLessonVideo
          >
        >
      | null =
      null;

    let existingVideoPublicId:
      | string
      | null =
      null;

    try {
      const existingResult =
        await db.query<{
          video_public_id:
            string | null;
        }>(
          `
            SELECT
              video_public_id
            FROM training_lessons
            WHERE id = $1
          `,
          [
            lessonId,
          ],
        );

      const existing =
        existingResult.rows[0];

      if (
        !existing
      ) {
        return errorResponse(
          res,
          404,
          "LESSON_NOT_FOUND",
          "Lesson not found.",
          "Lesson አልተገኘም።",
        );
      }

      existingVideoPublicId =
        existing.video_public_id;

      resolvedVideo =
        await resolveLessonVideo(
          input.videoPublicId,
          input.videoUrl,
          input.durationSeconds,
        );

      const result =
        await db.query<LessonRow>(
          `
            UPDATE training_lessons
            SET
              title_en = $2,
              title_am = $3,
              summary_en = $4,
              summary_am = $5,
              notes_en = $6,
              notes_am = $7,
              video_url = $8,
              video_public_id = $9,
              duration_seconds = $10,
              sort_order = $11,
              is_preview = $12,
              updated_at = NOW()
            WHERE id = $1
            RETURNING *
          `,
          [
            lessonId,
            input.titleEn,
            input.titleAm,
            input.summaryEn,
            input.summaryAm,
            input.notesEn,
            input.notesAm,
            resolvedVideo.videoUrl,
            resolvedVideo.videoPublicId,
            resolvedVideo.durationSeconds,
            input.sortOrder,
            input.isPreview,
          ],
        );

      const lesson =
        result.rows[0];

      if (
        !lesson
      ) {
        if (
          resolvedVideo
            .verified &&
          resolvedVideo
            .verified
            .publicId !==
            existingVideoPublicId
        ) {
          await safelyDeleteTrainingVideo(
            resolvedVideo
              .verified
              .publicId,
          );
        }

        return errorResponse(
          res,
          404,
          "LESSON_NOT_FOUND",
          "Lesson not found.",
          "Lesson አልተገኘም።",
        );
      }

      if (
        existingVideoPublicId &&
        existingVideoPublicId !==
          resolvedVideo.videoPublicId
      ) {
        await safelyDeleteTrainingVideo(
          existingVideoPublicId,
        );
      }

      return res.json({
        success:
          true,

        lesson:
          mapLesson(
            lesson,
          ),
      });
    } catch (
      error
    ) {
      if (
        resolvedVideo?.verified &&
        resolvedVideo
          .verified
          .publicId !==
          existingVideoPublicId
      ) {
        await safelyDeleteTrainingVideo(
          resolvedVideo
            .verified
            .publicId,
        );
      }

      if (
        error instanceof
          Error &&
        error.message ===
          "INVALID_TRAINING_VIDEO"
      ) {
        return errorResponse(
          res,
          400,
          "INVALID_TRAINING_VIDEO",
          "The uploaded training video is invalid, unsupported, or too large.",
          "የተጫነው training video ትክክል አይደለም፣ አይደገፍም ወይም በጣም ትልቅ ነው።",
        );
      }

      next(
        error,
      );
    }
  },
);

/* =========================================================
   DELETE LESSON
   ========================================================= */

router.delete(
  "/lessons/:lessonId",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    const lessonId =
      getUuidParam(
        req.params.lessonId,
        res,
      );

    if (
      !lessonId
    ) {
      return;
    }

    try {
      const result =
        await db.query<{
          id:
            string;

          video_public_id:
            string | null;
        }>(
          `
            DELETE FROM training_lessons
            WHERE id = $1
            RETURNING
              id,
              video_public_id
          `,
          [
            lessonId,
          ],
        );

      const lesson =
        result.rows[0];

      if (
        !lesson
      ) {
        return errorResponse(
          res,
          404,
          "LESSON_NOT_FOUND",
          "Lesson not found.",
          "Lesson አልተገኘም።",
        );
      }

      await safelyDeleteTrainingVideo(
        lesson.video_public_id,
      );

      return res.json({
        success:
          true,
      });
    } catch (
      error
    ) {
      next(
        error,
      );
    }
  },
);

/* =========================================================
   CREATE RESOURCE
   ========================================================= */

router.post(
  "/lessons/:lessonId/resources",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    const lessonId =
      getUuidParam(
        req.params.lessonId,
        res,
      );

    if (
      !lessonId
    ) {
      return;
    }

    const parsed =
      resourceInputSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      return invalidBody(
        res,
      );
    }

    const input =
      parsed.data;

    try {
      const result =
        await db.query<ResourceRow>(
          `
            INSERT INTO training_lesson_resources (
              lesson_id,
              label_en,
              label_am,
              url,
              sort_order
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5
            )
            RETURNING *
          `,
          [
            lessonId,
            input.labelEn,
            input.labelAm,
            input.url,
            input.sortOrder,
          ],
        );

      const resource =
        result.rows[0];

      if (
        !resource
      ) {
        return errorResponse(
          res,
          500,
          "RESOURCE_CREATE_FAILED",
          "The resource could not be created.",
          "Resource መፍጠር አልተቻለም።",
        );
      }

      return res
        .status(201)
        .json({
          success:
            true,

          resource:
            mapResource(
              resource,
            ),
        });
    } catch (
      error
    ) {
      if (
        isDatabaseError(
          error,
          "23503",
        )
      ) {
        return errorResponse(
          res,
          404,
          "LESSON_NOT_FOUND",
          "Lesson not found.",
          "Lesson አልተገኘም።",
        );
      }

      next(
        error,
      );
    }
  },
);

/* =========================================================
   UPDATE RESOURCE
   ========================================================= */

router.patch(
  "/resources/:resourceId",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    const resourceId =
      getUuidParam(
        req.params.resourceId,
        res,
      );

    if (
      !resourceId
    ) {
      return;
    }

    const parsed =
      resourceInputSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      return invalidBody(
        res,
      );
    }

    const input =
      parsed.data;

    try {
      const result =
        await db.query<ResourceRow>(
          `
            UPDATE training_lesson_resources
            SET
              label_en = $2,
              label_am = $3,
              url = $4,
              sort_order = $5,
              updated_at = NOW()
            WHERE id = $1
            RETURNING *
          `,
          [
            resourceId,
            input.labelEn,
            input.labelAm,
            input.url,
            input.sortOrder,
          ],
        );

      const resource =
        result.rows[0];

      if (
        !resource
      ) {
        return errorResponse(
          res,
          404,
          "RESOURCE_NOT_FOUND",
          "Resource not found.",
          "Resource አልተገኘም።",
        );
      }

      return res.json({
        success:
          true,

        resource:
          mapResource(
            resource,
          ),
      });
    } catch (
      error
    ) {
      next(
        error,
      );
    }
  },
);

/* =========================================================
   DELETE RESOURCE
   ========================================================= */

router.delete(
  "/resources/:resourceId",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    const resourceId =
      getUuidParam(
        req.params.resourceId,
        res,
      );

    if (
      !resourceId
    ) {
      return;
    }

    try {
      const result =
        await db.query<{
          id:
            string;
        }>(
          `
            DELETE FROM training_lesson_resources
            WHERE id = $1
            RETURNING id
          `,
          [
            resourceId,
          ],
        );

      if (
        !result.rows[0]
      ) {
        return errorResponse(
          res,
          404,
          "RESOURCE_NOT_FOUND",
          "Resource not found.",
          "Resource አልተገኘም።",
        );
      }

      return res.json({
        success:
          true,
      });
    } catch (
      error
    ) {
      next(
        error,
      );
    }
  },
);

export default router;
