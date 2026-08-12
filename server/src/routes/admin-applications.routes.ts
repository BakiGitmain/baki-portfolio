import {
  Router,
  type Response,
} from "express";

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
  requireAdmin,
} from "../middleware/auth.middleware.js";

import {
  listRepresentativePrograms,
} from "../services/partner-program.service.js";

import {
  recordPartnerActivity,
} from "../services/partner-activity.service.js";

import {
  sendApplicationRejectedEmail,
  sendApplicationUnderReviewEmail,
} from "../services/application-email.service.js";

/* =========================================================
   ROUTER
   ========================================================= */

const router =
  Router();

/* =========================================================
   TYPES
   ========================================================= */

type ApplicationStatus =
  | "pending"
  | "reviewing"
  | "accepted"
  | "rejected"
  | "archived";

type ApplicationRow = {
  id:
    string;

  application_number:
    string |
    number;

  full_name:
    string;

  father_name:
    string;

  email:
    string;

  phone:
    string;

  city:
    string;

  address:
    string;

  telegram:
    string |
    null;

  whatsapp:
    string |
    null;

  motivation:
    string;

  id_type:
    string;

  id_front_public_id:
    string;

  id_front_format:
    string;

  id_back_public_id:
    string;

  id_back_format:
    string;

  status:
    ApplicationStatus;

  admin_notes:
    string |
    null;

  rules_accepted:
    boolean;

  rules_accepted_at:
    Date;

  reviewed_at:
    Date |
    null;

  reviewed_by_admin_id:
    string |
    null;

  created_at:
    Date;

  updated_at:
    Date;
};

/* =========================================================
   HELPERS
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

function formatApplicationCode(
  applicationNumber:
    number |
    string,
) {
  return `APP-${String(
    applicationNumber,
  ).padStart(
    4,
    "0",
  )}`;
}

function mapApplication(
  row:
    ApplicationRow,
) {
  return {
    id:
      row.id,

    applicationCode:
      formatApplicationCode(
        row.application_number,
      ),

    fullName:
      row.full_name,

    fatherName:
      row.father_name,

    email:
      row.email,

    phone:
      row.phone,

    city:
      row.city,

    address:
      row.address,

    telegram:
      row.telegram,

    whatsapp:
      row.whatsapp,

    motivation:
      row.motivation,

    idType:
      row.id_type,

    documents: {
      front:
        Boolean(
          row.id_front_public_id,
        ),

      back:
        Boolean(
          row.id_back_public_id,
        ),
    },

    status:
      row.status,

    adminNotes:
      row.admin_notes ??
      "",

    rulesAccepted:
      row.rules_accepted,

    rulesAcceptedAt:
      row.rules_accepted_at,

    reviewedAt:
      row.reviewed_at,

    reviewedByAdminId:
      row.reviewed_by_admin_id,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

/* =========================================================
   VALIDATION
   ========================================================= */

const querySchema =
  z.object({
    search: z
      .string()
      .trim()
      .max(120)
      .optional()
      .default(
        "",
      ),

    status: z
      .enum([
        "all",
        "pending",
        "reviewing",
        "accepted",
        "rejected",
        "archived",
      ])
      .optional()
      .default(
        "all",
      ),

    page: z.coerce
      .number()
      .int()
      .min(1)
      .optional()
      .default(
        1,
      ),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(
        20,
      ),
  });

const idSchema =
  z
    .string()
    .uuid();

const updateStatusSchema =
  z.object({
    status: z.enum([
      "pending",
      "reviewing",
      "accepted",
      "rejected",
      "archived",
    ]),

    adminNotes: z
      .string()
      .trim()
      .max(5000)
      .optional(),
  });

const documentSideSchema =
  z.enum([
    "front",
    "back",
  ]);

/* =========================================================
   REQUIRE ADMIN
   ========================================================= */

router.use(
  requireAdmin,
);

/* =========================================================
   LIST APPLICATIONS
   ========================================================= */

router.get(
  "/",

  async (
    req,
    res,
    next,
  ) => {
    try {
      const parsed =
        querySchema.safeParse(
          req.query,
        );

      if (
        !parsed.success
      ) {
        errorResponse(
          res,
          400,
          "INVALID_QUERY",
          "Invalid applications query.",
          "የapplications query ትክክል አይደለም።",
        );

        return;
      }

      const {
        search,
        status,
        page,
        limit,
      } =
        parsed.data;

      const conditions:
        string[] =
        [];

      const values:
        unknown[] =
        [];

      if (
        status !==
        "all"
      ) {
        values.push(
          status,
        );

        conditions.push(
          `status = $${values.length}`,
        );
      }

      if (
        search
      ) {
        values.push(
          `%${search}%`,
        );

        const position =
          values.length;

        conditions.push(
          `
            (
              full_name ILIKE $${position}
              OR father_name ILIKE $${position}
              OR email ILIKE $${position}
              OR phone ILIKE $${position}
              OR city ILIKE $${position}
              OR CAST(application_number AS TEXT)
                ILIKE $${position}
            )
          `,
        );
      }

      const whereClause =
        conditions.length >
        0
          ? `WHERE ${conditions.join(
              " AND ",
            )}`
          : "";

      /* ===================================================
         SUMMARY
         =================================================== */

      const summaryResult =
        await db.query(
          `
            SELECT
              COUNT(*)::int AS total,

              COUNT(*) FILTER (
                WHERE status = 'pending'
              )::int AS pending,

              COUNT(*) FILTER (
                WHERE status = 'reviewing'
              )::int AS reviewing,

              COUNT(*) FILTER (
                WHERE status = 'accepted'
              )::int AS accepted,

              COUNT(*) FILTER (
                WHERE status = 'rejected'
              )::int AS rejected,

              COUNT(*) FILTER (
                WHERE status = 'archived'
              )::int AS archived
            FROM sales_representative_applications
          `,
        );

      /* ===================================================
         FILTERED COUNT
         =================================================== */

      const countResult =
        await db.query(
          `
            SELECT
              COUNT(*)::int AS count
            FROM sales_representative_applications
            ${whereClause}
          `,

          values,
        );

      const totalFiltered =
        Number(
          countResult
            .rows[0]
            ?.count ??
            0,
        );

      const offset =
        (
          page -
          1
        ) *
        limit;

      /* ===================================================
         DATA
         =================================================== */

      const dataValues =
        [
          ...values,

          limit,

          offset,
        ];

      const limitPosition =
        values.length +
        1;

      const offsetPosition =
        values.length +
        2;

      const result =
        await db.query(
          `
            SELECT
              id,
              application_number,

              full_name,
              father_name,

              email,
              phone,

              city,
              address,

              telegram,
              whatsapp,

              motivation,

              id_type,

              id_front_public_id,
              id_front_format,

              id_back_public_id,
              id_back_format,

              status,
              admin_notes,

              rules_accepted,
              rules_accepted_at,

              reviewed_at,
              reviewed_by_admin_id,

              created_at,
              updated_at
            FROM sales_representative_applications
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${limitPosition}
            OFFSET $${offsetPosition}
          `,

          dataValues,
        );

      const summary =
        summaryResult
          .rows[0] ??
        {};

      res.json({
        success:
          true,

        summary: {
          total:
            Number(
              summary.total ??
              0,
            ),

          pending:
            Number(
              summary.pending ??
              0,
            ),

          reviewing:
            Number(
              summary.reviewing ??
              0,
            ),

          accepted:
            Number(
              summary.accepted ??
              0,
            ),

          rejected:
            Number(
              summary.rejected ??
              0,
            ),

          archived:
            Number(
              summary.archived ??
              0,
            ),
        },

        pagination: {
          page,

          limit,

          total:
            totalFiltered,

          totalPages:
            Math.max(
              1,

              Math.ceil(
                totalFiltered /
                limit,
              ),
            ),
        },

        applications:
          (
            result.rows as
              ApplicationRow[]
          ).map(
            mapApplication,
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
   APPLICATION / PARTNER OPERATIONAL DETAIL
   ========================================================= */

router.get(
  "/:id/insight",

  async (
    req,
    res,
    next,
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
        "INVALID_APPLICATION_ID",
        "Invalid application id.",
        "á‹¨application id á‰µáŠ­áŠ­áˆ áŠ á‹­á‹°áˆˆáˆá¢",
      );

      return;
    }

    try {
      const representativeResult =
        await db.query(
          `
            SELECT
              representative.id,
              representative.username,
              representative.name,
              representative.display_name,
              representative.email,
              representative.phone,
              representative.city,
              representative.preferred_language,
              representative.is_active,
              representative.last_login_at,
              representative.created_at,
              representative.avatar_public_id,
              representative.avatar_format,
              representative.avatar_version
            FROM sales_representatives representative
            WHERE representative.application_id = $1::uuid
            LIMIT 1
          `,
          [
            parsedId.data,
          ],
        );

      const representative =
        representativeResult.rows[0];

      if (
        !representative
      ) {
        res.json({
          success:
            true,

          insight: {
            representative:
              null,

            summary:
              null,

            reports: [],

            training: [],

            programs: [],

            activity: [],

            leads: {
              available:
                false,

              reason:
                "No dedicated lead-management entity exists in this system.",
            },
          },
        });

        return;
      }

      const [
        reportResult,
        trainingResult,
        activityResult,
        programs,
      ] =
        await Promise.all([
          db.query(
            `
              SELECT
                report.id,
                report.message,
                report.admin_read_at,
                report.created_at,
                report.updated_at,
                (
                  SELECT COUNT(*)::int
                  FROM representative_report_replies reply
                  WHERE reply.report_id = report.id
                ) AS reply_count,
                (
                  SELECT MAX(reply.created_at)
                  FROM representative_report_replies reply
                  WHERE reply.report_id = report.id
                ) AS latest_reply_at,
                (
                  SELECT COALESCE(
                    JSON_AGG(
                      JSON_BUILD_OBJECT(
                        'id', reply.id,
                        'message', reply.message,
                        'representativeReadAt', reply.representative_read_at,
                        'createdAt', reply.created_at
                      )
                      ORDER BY reply.created_at ASC
                    ),
                    '[]'::json
                  )
                  FROM representative_report_replies reply
                  WHERE reply.report_id = report.id
                ) AS replies,
                COUNT(*) OVER()::int AS total_reports,
                COUNT(*) FILTER (
                  WHERE report.admin_read_at IS NULL
                ) OVER()::int AS total_unread_reports
              FROM representative_reports report
              WHERE report.representative_id = $1::uuid
              ORDER BY report.created_at DESC
              LIMIT 100
            `,
            [
              representative.id,
            ],
          ),

          db.query(
            `
              SELECT
                course.id AS course_id,
                course.title_en AS course_title_en,
                course.title_am AS course_title_am,
                course.status AS course_status,
                course.sort_order AS course_sort_order,
                section.id AS section_id,
                section.title_en AS section_title_en,
                section.title_am AS section_title_am,
                section.sort_order AS section_sort_order,
                lesson.id AS lesson_id,
                lesson.title_en AS lesson_title_en,
                lesson.title_am AS lesson_title_am,
                lesson.sort_order AS lesson_sort_order,
                lesson.duration_seconds,
                COALESCE(progress.last_position_seconds, 0)::int AS watched_seconds,
                COALESCE(progress.completed, FALSE) AS completed,
                progress.completed_at,
                progress.updated_at AS progress_updated_at
              FROM training_courses course
              LEFT JOIN training_sections section
                ON section.course_id = course.id
              LEFT JOIN training_lessons lesson
                ON lesson.section_id = section.id
              LEFT JOIN representative_training_lesson_progress progress
                ON
                  progress.lesson_id = lesson.id
                  AND progress.representative_id = $1::uuid
              ORDER BY
                course.sort_order ASC,
                course.created_at ASC,
                section.sort_order ASC,
                section.created_at ASC,
                lesson.sort_order ASC,
                lesson.created_at ASC
            `,
            [
              representative.id,
            ],
          ),

          db.query(
            `
              SELECT *
              FROM (
                SELECT
                  'report_created'::text AS type,
                  report.id::text AS entity_id,
                  LEFT(report.message, 160) AS label,
                  report.created_at
                FROM representative_reports report
                WHERE report.representative_id = $1::uuid

                UNION ALL

                SELECT
                  'report_replied'::text,
                  report.id::text,
                  LEFT(reply.message, 160),
                  reply.created_at
                FROM representative_report_replies reply
                INNER JOIN representative_reports report
                  ON report.id = reply.report_id
                WHERE report.representative_id = $1::uuid

                UNION ALL

                SELECT
                  'lesson_completed'::text,
                  lesson.id::text,
                  lesson.title_en,
                  progress.completed_at
                FROM representative_training_lesson_progress progress
                INNER JOIN training_lessons lesson
                  ON lesson.id = progress.lesson_id
                WHERE
                  progress.representative_id = $1::uuid
                  AND progress.completed = TRUE
                  AND progress.completed_at IS NOT NULL

                UNION ALL

                SELECT
                  event.event_type::text,
                  event.id::text,
                  COALESCE(
                    event.metadata ->> 'label',
                    event.metadata ->> 'status',
                    event.event_type
                  ),
                  event.created_at
                FROM partner_activity_events event
                WHERE
                  (
                    event.representative_id = $1::uuid
                    OR event.application_id = $2::uuid
                  )
                  AND event.event_type <> 'lesson_completed'
              ) activity
              WHERE activity.created_at IS NOT NULL
              ORDER BY activity.created_at DESC
              LIMIT 100
            `,
            [
              representative.id,
              parsedId.data,
            ],
          ),

          listRepresentativePrograms(
            representative.id,
            {
              activeOnly:
                false,
            },
          ),
        ]);

      type TrainingSection = {
        id:
          string;

        titleEn:
          string;

        titleAm:
          string;

        lessons:
          Array<
            Record<
              string,
              unknown
            >
          >;
      };

      type TrainingCourse = {
        id:
          string;

        titleEn:
          string;

        titleAm:
          string;

        status:
          string;

        sections:
          TrainingSection[];
      };

      const courses =
        new Map<
          string,
          TrainingCourse
        >();

      const sections =
        new Map<
          string,
          TrainingSection
        >();

      for (
        const row of
        trainingResult.rows
      ) {
        let course =
          courses.get(
            row.course_id,
          );

        if (
          !course
        ) {
          course = {
            id:
              row.course_id,

            titleEn:
              row.course_title_en,

            titleAm:
              row.course_title_am,

            status:
              row.course_status,

            sections: [],
          };

          courses.set(
            row.course_id,
            course,
          );
        }

        if (
          !row.section_id
        ) {
          continue;
        }

        let section =
          sections.get(
            row.section_id,
          );

        if (
          !section
        ) {
          section = {
            id:
              row.section_id,

            titleEn:
              row.section_title_en,

            titleAm:
              row.section_title_am,

            lessons: [],
          };

          sections.set(
            row.section_id,
            section,
          );

          course.sections.push(
            section,
          );
        }

        if (
          row.lesson_id
        ) {
          section.lessons.push({
            id:
              row.lesson_id,

            titleEn:
              row.lesson_title_en,

            titleAm:
              row.lesson_title_am,

            durationSeconds:
              Number(
                row.duration_seconds,
              ),

            watchedSeconds:
              Number(
                row.watched_seconds,
              ),

            completed:
              Boolean(
                row.completed,
              ),

            completedAt:
              row.completed_at ??
              null,

            updatedAt:
              row.progress_updated_at ??
              null,
          });
        }
      }

      const training =
        Array.from(
          courses.values(),
        ).map(
          (
            course,
          ) => {
            const lessons =
              course.sections.flatMap(
                (
                  section,
                ) =>
                  section.lessons,
              );

            const completed =
              lessons.filter(
                (
                  lesson,
                ) =>
                  lesson.completed ===
                  true,
              ).length;

            return {
              ...course,

              progress: {
                totalLessons:
                  lessons.length,

                completedLessons:
                  completed,

                percent:
                  lessons.length >
                  0
                    ? Math.round(
                        100 *
                          completed /
                          lessons.length,
                      )
                    : 0,
              },
            };
          },
        );

      const allLessons =
        training.flatMap(
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

      const completedLessons =
        allLessons.filter(
          (
            lesson,
          ) =>
            lesson.completed ===
            true,
        ).length;

      const avatarUrl =
        representative
          .avatar_public_id
          ? cloudinary.url(
              representative
                .avatar_public_id,
              {
                secure:
                  true,

                version:
                  representative
                    .avatar_version ??
                  undefined,

                format:
                  representative
                    .avatar_format ??
                  undefined,

                transformation: [
                  {
                    width:
                      512,

                    height:
                      512,

                    crop:
                      "fill",

                    gravity:
                      "auto",
                  },
                ],
              },
            )
          : null;

      const lastReportAt =
        reportResult.rows[0]
          ?.created_at ??
        null;

      const lastTrainingAt =
        trainingResult.rows.reduce<
          Date |
          null
        >(
          (
            latest,
            row,
          ) => {
            if (
              !row.progress_updated_at
            ) {
              return latest;
            }

            const value =
              new Date(
                row.progress_updated_at,
              );

            return !latest ||
              value >
                latest
              ? value
              : latest;
          },
          null,
        );

      const lastActivityAt = [
        representative
          .last_login_at,
        lastReportAt,
        lastTrainingAt,
      ]
        .filter(
          Boolean,
        )
        .map(
          (
            value,
          ) =>
            new Date(
              value,
            ),
        )
        .sort(
          (
            left,
            right,
          ) =>
            right.getTime() -
            left.getTime(),
        )[0] ??
        null;

      res.json({
        success:
          true,

        insight: {
          representative: {
            id:
              representative.id,

            partnerId:
              representative.username,

            legalName:
              representative.name,

            displayName:
              representative.display_name ??
              "",

            effectiveName:
              representative.display_name ||
              representative.name,

            email:
              representative.email,

            phone:
              representative.phone,

            city:
              representative.city,

            preferredLanguage:
              representative.preferred_language,

            active:
              Boolean(
                representative.is_active,
              ),

            avatarUrl,

            createdAt:
              representative.created_at,

            lastLoginAt:
              representative.last_login_at ??
              null,

            lastActivityAt,
          },

          summary: {
            reports:
              Number(
                reportResult.rows[0]
                  ?.total_reports ??
                  0,
              ),

            unreadReports:
              Number(
                reportResult.rows[0]
                  ?.total_unread_reports ??
                  0,
              ),

            lastReportAt,

            trainingPercent:
              allLessons.length >
              0
                ? Math.round(
                    100 *
                      completedLessons /
                      allLessons.length,
                  )
                : 0,

            completedLessons,

            totalLessons:
              allLessons.length,

            programs:
              programs.length,

            activePrograms:
              programs.filter(
                (
                  program,
                ) =>
                  program.effectiveStatus ===
                  "active",
              ).length,
          },

          reports:
            reportResult.rows.map(
              (
                report,
              ) => ({
                id:
                  report.id,

                message:
                  report.message,

                adminReadAt:
                  report.admin_read_at ??
                  null,

                replyCount:
                  Number(
                    report.reply_count,
                  ),

                latestReplyAt:
                  report.latest_reply_at ??
                  null,

                replies:
                  Array.isArray(
                    report.replies,
                  )
                    ? report.replies
                    : [],

                createdAt:
                  report.created_at,

                updatedAt:
                  report.updated_at,
              }),
            ),

          training,

          programs,

          activity:
            activityResult.rows.map(
              (
                activity,
              ) => ({
                type:
                  activity.type,

                entityId:
                  activity.entity_id,

                label:
                  activity.label,

                createdAt:
                  activity.created_at,
              }),
            ),

          leads: {
            available:
              false,

            reason:
              "No dedicated lead-management entity exists in this system. Legacy report categories are not presented as a lead pipeline.",
          },
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
   GET ONE
   ========================================================= */

router.get(
  "/:id",

  async (
    req,
    res,
    next,
  ) => {
    try {
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
          "INVALID_APPLICATION_ID",
          "Invalid application id.",
          "የapplication id ትክክል አይደለም።",
        );

        return;
      }

      const result =
        await db.query(
          `
            SELECT
              id,
              application_number,

              full_name,
              father_name,

              email,
              phone,

              city,
              address,

              telegram,
              whatsapp,

              motivation,

              id_type,

              id_front_public_id,
              id_front_format,

              id_back_public_id,
              id_back_format,

              status,
              admin_notes,

              rules_accepted,
              rules_accepted_at,

              reviewed_at,
              reviewed_by_admin_id,

              created_at,
              updated_at
            FROM sales_representative_applications
            WHERE id = $1::uuid
            LIMIT 1
          `,
          [
            parsedId.data,
          ],
        );

      if (
        !result.rowCount
      ) {
        errorResponse(
          res,
          404,
          "APPLICATION_NOT_FOUND",
          "Application not found.",
          "Application አልተገኘም።",
        );

        return;
      }

      res.json({
        success:
          true,

        application:
          mapApplication(
            result
              .rows[0] as
              ApplicationRow,
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
   PRIVATE IDENTIFICATION DOCUMENT
   ========================================================= */

router.get(
  "/:id/document/:side",

  async (
    req,
    res,
    next,
  ) => {
    try {
      const parsedId =
        idSchema.safeParse(
          req.params.id,
        );

      const parsedSide =
        documentSideSchema.safeParse(
          req.params.side,
        );

      if (
        !parsedId.success ||
        !parsedSide.success
      ) {
        errorResponse(
          res,
          400,
          "INVALID_DOCUMENT_REQUEST",
          "Invalid document request.",
          "የdocument request ትክክል አይደለም።",
        );

        return;
      }

      const result =
        await db.query(
          `
            SELECT
              id_front_public_id,
              id_front_format,

              id_back_public_id,
              id_back_format
            FROM sales_representative_applications
            WHERE id = $1::uuid
            LIMIT 1
          `,
          [
            parsedId.data,
          ],
        );

      if (
        !result.rowCount
      ) {
        errorResponse(
          res,
          404,
          "APPLICATION_NOT_FOUND",
          "Application not found.",
          "Application አልተገኘም።",
        );

        return;
      }

      const row =
        result.rows[0];

      const isFront =
        parsedSide.data ===
        "front";

      const publicId =
        isFront
          ? row
              .id_front_public_id
          : row
              .id_back_public_id;

      const format =
        isFront
          ? row
              .id_front_format
          : row
              .id_back_format;

      if (
        !publicId ||
        !format
      ) {
        errorResponse(
          res,
          404,
          "DOCUMENT_NOT_FOUND",
          "Identification document not found.",
          "የመታወቂያ document አልተገኘም።",
        );

        return;
      }

      const expiresAt =
        Math.floor(
          Date.now() /
            1000,
        ) +
        5 *
          60;

      const url =
        cloudinary.utils
          .private_download_url(
            publicId,
            format,
            {
              resource_type:
                "image",

              type:
                "authenticated",

              expires_at:
                expiresAt,

              attachment:
                false,
            },
          );

      res.json({
        success:
          true,

        url,

        expiresAt,
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
   UPDATE STATUS / NOTES
   ========================================================= */

router.patch(
  "/:id/status",

  async (
    req,
    res,
    next,
  ) => {
    try {
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
          "INVALID_APPLICATION_ID",
          "Invalid application id.",
          "የapplication id ትክክል አይደለም።",
        );

        return;
      }

      const parsedBody =
        updateStatusSchema.safeParse(
          req.body,
        );

      if (
        !parsedBody.success
      ) {
        errorResponse(
          res,
          400,
          "INVALID_APPLICATION_UPDATE",
          "Invalid application update.",
          "የapplication update ትክክል አይደለም።",
        );

        return;
      }

      const {
        status,
        adminNotes,
      } =
        parsedBody.data;

      /* ===================================================
         ACCEPTED MUST USE ONBOARDING
         =================================================== */

      if (
        status ===
        "accepted"
      ) {
        errorResponse(
          res,
          409,
          "USE_REPRESENTATIVE_ONBOARDING",
          "Use Accept & Create to accept this applicant. Acceptance must create the Partner account first.",
          "Applicantን accept ለማድረግ Accept & Create ይጠቀሙ። Partner account መጀመሪያ መፈጠር አለበት።",
        );

        return;
      }

      /* ===================================================
         REJECTION REASON REQUIRED
         =================================================== */

      if (
        status ===
          "rejected" &&
        !adminNotes?.trim()
      ) {
        errorResponse(
          res,
          400,
          "REJECTION_REASON_REQUIRED",
          "Write the rejection reason before rejecting the application.",
          "Applicationን reject ከማድረግዎ በፊት rejection reason ይጻፉ።",
        );

        return;
      }

      const adminId =
        req.auth?.id;

      if (
        !adminId
      ) {
        errorResponse(
          res,
          401,
          "AUTH_REQUIRED",
          "Authentication required.",
          "Authentication ያስፈልጋል።",
        );

        return;
      }

      /* ===================================================
         GET CURRENT STATUS
         =================================================== */

      const currentResult =
        await db.query(
          `
            SELECT
              id,
              status
            FROM sales_representative_applications
            WHERE id = $1::uuid
            LIMIT 1
          `,
          [
            parsedId.data,
          ],
        );

      if (
        !currentResult.rowCount
      ) {
        errorResponse(
          res,
          404,
          "APPLICATION_NOT_FOUND",
          "Application not found.",
          "Application አልተገኘም።",
        );

        return;
      }

      const previousStatus =
        currentResult
          .rows[0]
          .status as
          ApplicationStatus;

      /* ===================================================
         UPDATE

         Explicit parameter types prevent PostgreSQL from
         trying to infer multiple incompatible types.

         $1 = status      -> varchar
         $2 = notes       -> text
         $3 = admin id    -> uuid
         $4 = application -> uuid
         =================================================== */

      const result =
        await db.query(
          `
            UPDATE sales_representative_applications
            SET
              status =
                $1::varchar,

              admin_notes =
                COALESCE(
                  $2::text,
                  admin_notes
                ),

              reviewed_at =
                CASE
                  WHEN $1::varchar = 'pending'
                    THEN NULL

                  ELSE COALESCE(
                    reviewed_at,
                    NOW()
                  )
                END,

              reviewed_by_admin_id =
                CASE
                  WHEN $1::varchar = 'pending'
                    THEN NULL::uuid

                  ELSE $3::uuid
                END,

              updated_at =
                NOW()

            WHERE id =
              $4::uuid

            RETURNING
              id,
              application_number,

              full_name,
              father_name,

              email,
              phone,

              city,
              address,

              telegram,
              whatsapp,

              motivation,

              id_type,

              id_front_public_id,
              id_front_format,

              id_back_public_id,
              id_back_format,

              status,
              admin_notes,

              rules_accepted,
              rules_accepted_at,

              reviewed_at,
              reviewed_by_admin_id,

              created_at,
              updated_at
          `,
          [
            status,

            adminNotes ??
              null,

            adminId,

            parsedId.data,
          ],
        );

      if (
        !result.rowCount
      ) {
        errorResponse(
          res,
          404,
          "APPLICATION_NOT_FOUND",
          "Application not found.",
          "Application አልተገኘም።",
        );

        return;
      }

      const row =
        result
          .rows[0] as
          ApplicationRow;

      const statusChanged =
        previousStatus !==
        row.status;

      let emailSent:
        boolean |
        null =
        null;

      /* ===================================================
         STATUS EMAIL
         =================================================== */

      if (
        statusChanged
      ) {
        await recordPartnerActivity({
          eventType:
            "application_status_changed",

          actorType:
            "admin",

          adminUserId:
            adminId,

          applicationId:
            row.id,

          metadata: {
            status:
              row.status,
          },
        });

        const applicationCode =
          formatApplicationCode(
            row.application_number,
          );

        const eventId =
          new Date(
            row.updated_at,
          )
            .getTime()
            .toString();

        /* =================================================
           PENDING / REVIEWING
           ================================================= */

        if (
          row.status ===
            "pending" ||
          row.status ===
            "reviewing"
        ) {
          emailSent =
            await sendApplicationUnderReviewEmail({
              applicationId:
                row.id,

              applicationCode,

              email:
                row.email,

              fullName:
                row.full_name,

              eventId,
            });
        }

        /* =================================================
           REJECTED
           ================================================= */

        else if (
          row.status ===
          "rejected"
        ) {
          const rejectionReason =
            row.admin_notes
              ?.trim();

          if (
            rejectionReason
          ) {
            emailSent =
              await sendApplicationRejectedEmail({
                applicationId:
                  row.id,

                applicationCode,

                email:
                  row.email,

                fullName:
                  row.full_name,

                reason:
                  rejectionReason,

                eventId,
              });
          }
        }
      }

      /* ===================================================
         RESPONSE
         =================================================== */

      res.json({
        success:
          true,

        emailSent,

        application:
          mapApplication(
            row,
          ),

        message: {
          en:
            statusChanged &&
            emailSent ===
              true
              ? "Application updated successfully and the applicant was notified by email."
              : statusChanged &&
                  emailSent ===
                    false
                ? "Application updated successfully, but the notification email could not be sent."
                : "Application updated successfully.",

          am:
            statusChanged &&
            emailSent ===
              true
              ? "Application በተሳካ ሁኔታ ተቀይሯል እና applicantው በemail ተነግሮታል።"
              : statusChanged &&
                  emailSent ===
                    false
                ? "Application በተሳካ ሁኔታ ተቀይሯል፣ ነገር ግን notification email መላክ አልተቻለም።"
                : "Application በተሳካ ሁኔታ ተቀይሯል።",
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
