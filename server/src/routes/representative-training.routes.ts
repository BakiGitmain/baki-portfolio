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
  requireRepresentative,
  requireRepresentativeReady,
} from "../middleware/representative-auth.middleware.js";

import {
  recordPartnerActivity,
} from "../services/partner-activity.service.js";

const router =
  Router();

const progressRateLimit =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit:
      400,

    standardHeaders:
      true,

    legacyHeaders:
      false,
  });

type RouteParamValue =
  | string
  | string[]
  | undefined;

type CourseRow = {
  id: string;

  slug: string;

  title_en: string;
  title_am: string;

  description_en: string;
  description_am: string;

  sort_order: number;
};

type SectionRow = {
  id: string;

  course_id: string;

  title_en: string;
  title_am: string;

  description_en: string;
  description_am: string;

  sort_order: number;
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

  video_url:
    string | null;

  duration_seconds:
    number;

  sort_order:
    number;

  last_position_seconds:
    number;

  completed:
    boolean;

  completed_at:
    Date | null;
};

type ResourceRow = {
  id: string;

  lesson_id:
    string;

  label_en:
    string;

  label_am:
    string;

  url:
    string;

  sort_order:
    number;
};

function sendError(
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
  return res
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

function normalizeRouteParam(
  value:
    RouteParamValue,
) {
  if (
    Array.isArray(
      value,
    )
  ) {
    return value.length ===
      1
      ? value[0]
      : undefined;
  }

  return value;
}

const uuidSchema =
  z
    .string()
    .uuid();

function getUuidParam(
  value:
    RouteParamValue,

  res:
    Response,
) {
  const parsed =
    uuidSchema.safeParse(
      normalizeRouteParam(
        value,
      ),
    );

  if (
    !parsed.success
  ) {
    sendError(
      res,

      400,

      "INVALID_LESSON_ID",

      "The training lesson ID is invalid.",

      "የTraining lesson ID ትክክል አይደለም።",
    );

    return null;
  }

  return parsed.data;
}

router.use(
  requireRepresentative,

  requireRepresentativeReady,
);

/* =========================================================
   GET TRAINING COURSES
   ========================================================= */

router.get(
  "/courses",

  async (
    req,
    res,
    next,
  ) => {
    try {
      const representativeId =
        req.auth!.id;

      const [
        courseResult,
        sectionResult,
        lessonResult,
        resourceResult,
      ] =
        await Promise.all([
          db.query<CourseRow>(
            `
              SELECT
                id,
                slug,
                title_en,
                title_am,
                description_en,
                description_am,
                sort_order
              FROM training_courses
              WHERE
                status = 'published'
              ORDER BY
                sort_order ASC,
                created_at ASC
            `,
          ),

          db.query<SectionRow>(
            `
              SELECT
                s.id,
                s.course_id,
                s.title_en,
                s.title_am,
                s.description_en,
                s.description_am,
                s.sort_order
              FROM training_sections s

              INNER JOIN training_courses c
                ON c.id = s.course_id

              WHERE
                c.status = 'published'

              ORDER BY
                c.sort_order ASC,
                s.sort_order ASC,
                s.created_at ASC
            `,
          ),

          db.query<LessonRow>(
            `
              SELECT
                l.id,
                l.section_id,

                l.title_en,
                l.title_am,

                l.summary_en,
                l.summary_am,

                l.notes_en,
                l.notes_am,

                l.video_url,

                l.duration_seconds,

                l.sort_order,

                COALESCE(
                  p.last_position_seconds,
                  0
                )::int AS last_position_seconds,

                COALESCE(
                  p.completed,
                  FALSE
                ) AS completed,

                p.completed_at

              FROM training_lessons l

              INNER JOIN training_sections s
                ON s.id = l.section_id

              INNER JOIN training_courses c
                ON c.id = s.course_id

              LEFT JOIN representative_training_lesson_progress p
                ON
                  p.lesson_id = l.id
                  AND
                  p.representative_id = $1

              WHERE
                c.status = 'published'

              ORDER BY
                c.sort_order ASC,
                s.sort_order ASC,
                l.sort_order ASC,
                l.created_at ASC
            `,
            [
              representativeId,
            ],
          ),

          db.query<ResourceRow>(
            `
              SELECT
                r.id,
                r.lesson_id,

                r.label_en,
                r.label_am,

                r.url,

                r.sort_order

              FROM training_lesson_resources r

              INNER JOIN training_lessons l
                ON l.id = r.lesson_id

              INNER JOIN training_sections s
                ON s.id = l.section_id

              INNER JOIN training_courses c
                ON c.id = s.course_id

              WHERE
                c.status = 'published'

              ORDER BY
                r.sort_order ASC,
                r.created_at ASC
            `,
          ),
        ]);

      const resourcesByLesson =
        new Map<
          string,
          Array<{
            id: string;

            labelEn:
              string;

            labelAm:
              string;

            url:
              string;

            sortOrder:
              number;
          }>
        >();

      for (
        const resource of
        resourceResult.rows
      ) {
        const list =
          resourcesByLesson.get(
            resource.lesson_id,
          ) ??
          [];

        list.push({
          id:
            resource.id,

          labelEn:
            resource.label_en,

          labelAm:
            resource.label_am,

          url:
            resource.url,

          sortOrder:
            resource.sort_order,
        });

        resourcesByLesson.set(
          resource.lesson_id,

          list,
        );
      }

      const lessonsBySection =
        new Map<
          string,
          Array<{
            id: string;

            sectionId:
              string;

            titleEn:
              string;

            titleAm:
              string;

            summaryEn:
              string;

            summaryAm:
              string;

            notesEn:
              string;

            notesAm:
              string;

            videoUrl:
              string | null;

            durationSeconds:
              number;

            sortOrder:
              number;

            progress: {
              watchedSeconds:
                number;

              completed:
                boolean;

              completedAt:
                Date | null;
            };

            resources:
              Array<{
                id:
                  string;

                labelEn:
                  string;

                labelAm:
                  string;

                url:
                  string;

                sortOrder:
                  number;
              }>;
          }>
        >();

      for (
        const lesson of
        lessonResult.rows
      ) {
        const list =
          lessonsBySection.get(
            lesson.section_id,
          ) ??
          [];

        list.push({
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

          durationSeconds:
            Number(
              lesson.duration_seconds,
            ) ||
            0,

          sortOrder:
            Number(
              lesson.sort_order,
            ) ||
            0,

          progress: {
            watchedSeconds:
              Number(
                lesson.last_position_seconds,
              ) ||
              0,

            completed:
              Boolean(
                lesson.completed,
              ),

            completedAt:
              lesson.completed_at,
          },

          resources:
            resourcesByLesson.get(
              lesson.id,
            ) ??
            [],
        });

        lessonsBySection.set(
          lesson.section_id,

          list,
        );
      }

      const sectionsByCourse =
        new Map<
          string,
          Array<{
            id:
              string;

            courseId:
              string;

            titleEn:
              string;

            titleAm:
              string;

            descriptionEn:
              string;

            descriptionAm:
              string;

            sortOrder:
              number;

            lessons:
              NonNullable<
                ReturnType<
                  typeof lessonsBySection.get
                >
              >;
          }>
        >();

      for (
        const section of
        sectionResult.rows
      ) {
        const list =
          sectionsByCourse.get(
            section.course_id,
          ) ??
          [];

        list.push({
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
            Number(
              section.sort_order,
            ) ||
            0,

          lessons:
            lessonsBySection.get(
              section.id,
            ) ??
            [],
        });

        sectionsByCourse.set(
          section.course_id,

          list,
        );
      }

      const courses =
        courseResult.rows.map(
          (
            course,
          ) => {
            const sections =
              sectionsByCourse.get(
                course.id,
              ) ??
              [];

            const lessons =
              sections.flatMap(
                (
                  section,
                ) =>
                  section.lessons,
              );

            const totalLessons =
              lessons.length;

            const completedLessons =
              lessons.filter(
                (
                  lesson,
                ) =>
                  lesson
                    .progress
                    .completed,
              ).length;

            const progressPercent =
              totalLessons >
              0
                ? Math.round(
                    (
                      completedLessons /
                      totalLessons
                    ) *
                      100,
                  )
                : 0;

            const totalDurationSeconds =
              lessons.reduce(
                (
                  total,
                  lesson,
                ) =>
                  total +
                  lesson.durationSeconds,

                0,
              );

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

              sortOrder:
                Number(
                  course.sort_order,
                ) ||
                0,

              progress: {
                totalLessons,

                completedLessons,

                progressPercent,

                totalDurationSeconds,
              },

              sections,
            };
          },
        );

      const allLessons =
        courses.flatMap(
          (
            course,
          ) =>
            course.sections.flatMap(
              (
                section,
              ) =>
                section.lessons,
            ),
        );

      const overallCompleted =
        allLessons.filter(
          (
            lesson,
          ) =>
            lesson.progress.completed,
        ).length;

      const overallPercent =
        allLessons.length >
        0
          ? Math.round(
              (
                overallCompleted /
                allLessons.length
              ) *
                100,
            )
          : 0;

      return res.json({
        success:
          true,

        courses,

        overallProgress: {
          totalLessons:
            allLessons.length,

          completedLessons:
            overallCompleted,

          progressPercent:
            overallPercent,
        },
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
   SAVE LESSON PROGRESS
   ========================================================= */

const progressSchema =
  z
    .object({
      watchedSeconds:
        z
          .number()
          .finite()
          .min(0)
          .max(
            604800,
          ),

      durationSeconds:
        z
          .number()
          .finite()
          .min(0)
          .max(
            604800,
          )
          .optional(),
    })
    .strict();

router.post(
  "/lessons/:lessonId/progress",

  progressRateLimit,

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
      progressSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      return sendError(
        res,

        400,

        "INVALID_PROGRESS",

        "The lesson progress information is invalid.",

        "የLesson progress መረጃው ትክክል አይደለም።",
      );
    }

    try {
      const representativeId =
        req.auth!.id;

      const lessonResult =
        await db.query<{
          id:
            string;

          duration_seconds:
            number;

          title_en:
            string;
        }>(
          `
            SELECT
              l.id,
              l.duration_seconds,
              l.title_en

            FROM training_lessons l

            INNER JOIN training_sections s
              ON s.id = l.section_id

            INNER JOIN training_courses c
              ON c.id = s.course_id

            WHERE
              l.id = $1
              AND
              c.status = 'published'

            LIMIT 1
          `,
          [
            lessonId,
          ],
        );

      const lesson =
        lessonResult.rows[0];

      if (
        !lesson
      ) {
        return sendError(
          res,

          404,

          "LESSON_NOT_FOUND",

          "Training lesson not found.",

          "Training lesson አልተገኘም።",
        );
      }

      const storedDuration =
        Number(
          lesson.duration_seconds,
        ) ||
        0;

      const reportedDuration =
        Math.round(
          parsed.data
            .durationSeconds ??
            0,
        );

      const effectiveDuration =
        storedDuration >
        0
          ? storedDuration
          : reportedDuration;

      const reportedPosition =
        Math.floor(
          parsed.data
            .watchedSeconds,
        );

      const watchedSeconds =
        effectiveDuration >
        0
          ? Math.min(
              reportedPosition,

              effectiveDuration,
            )
          : reportedPosition;

      /*
        Lesson completes automatically
        once playback reaches the final
        4 seconds.

        Example:
        60 second video
        threshold = 56 seconds.
      */

      const completionThreshold =
        effectiveDuration >
        0
          ? Math.max(
              1,

              effectiveDuration -
                4,
            )
          : Number.POSITIVE_INFINITY;

      const shouldComplete =
        effectiveDuration >
          0 &&
        watchedSeconds >=
          completionThreshold;

      const result =
        await db.query<{
          last_position_seconds:
            number;

          completed:
            boolean;

          completed_at:
            Date | null;

          was_completed:
            boolean;
        }>(
          `
            WITH previous AS (
              SELECT completed
              FROM representative_training_lesson_progress
              WHERE
                representative_id = $1::uuid
                AND lesson_id = $2::uuid
              FOR UPDATE
            ),
            saved AS (
              INSERT INTO representative_training_lesson_progress (
                representative_id,
                lesson_id,
                last_position_seconds,
                completed,
                completed_at,
                updated_at
              )
              VALUES (
                $1::uuid,
                $2::uuid,
                $3::int,
                $4::boolean,
                CASE
                  WHEN $4::boolean = TRUE
                    THEN NOW()
                  ELSE NULL
                END,
                NOW()
              )

              ON CONFLICT (
                representative_id,
                lesson_id
              )

              DO UPDATE SET
                last_position_seconds =
                  GREATEST(
                    representative_training_lesson_progress.last_position_seconds,
                    EXCLUDED.last_position_seconds
                  ),

                completed =
                  representative_training_lesson_progress.completed
                  OR
                  EXCLUDED.completed,

                completed_at =
                  CASE
                    WHEN representative_training_lesson_progress.completed = TRUE
                      THEN representative_training_lesson_progress.completed_at

                    WHEN EXCLUDED.completed = TRUE
                      THEN NOW()

                    ELSE
                      representative_training_lesson_progress.completed_at
                  END,

                updated_at =
                  NOW()

              RETURNING
                last_position_seconds,
                completed,
                completed_at
            )
            SELECT
              saved.last_position_seconds,
              saved.completed,
              saved.completed_at,
              COALESCE(
                (
                  SELECT previous.completed
                  FROM previous
                ),
                FALSE
              ) AS was_completed
            FROM saved
          `,
          [
            representativeId,

            lessonId,

            watchedSeconds,

            shouldComplete,
          ],
        );

      const progress =
        result.rows[0];

      if (
        !progress
      ) {
        return sendError(
          res,

          500,

          "PROGRESS_SAVE_FAILED",

          "Unable to save lesson progress.",

          "የLesson progress ማስቀመጥ አልተቻለም።",
        );
      }

      if (
        progress.completed &&
        !progress.was_completed
      ) {
        await recordPartnerActivity({
          eventType:
            "lesson_completed",

          actorType:
            "representative",

          representativeId,

          metadata: {
            label:
              lesson.title_en,
          },
        });
      }

      return res.json({
        success:
          true,

        progress: {
          watchedSeconds:
            Number(
              progress.last_position_seconds,
            ) ||
            0,

          completed:
            Boolean(
              progress.completed,
            ),

          completedAt:
            progress.completed_at,
        },
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
