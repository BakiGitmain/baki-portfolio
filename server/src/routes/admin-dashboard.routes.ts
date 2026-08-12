import {
  Router,
} from "express";

import {
  z,
} from "zod";

import {
  db,
} from "../config/db.js";

import {
  requireAdmin,
} from "../middleware/auth.middleware.js";

import {
  getPartnerChatOnlineSummary,
} from "../socket/partner-chat.socket.js";

const router =
  Router();

const querySchema =
  z.object({
    range:
      z
        .enum([
          "7",
          "30",
          "90",
        ])
        .optional()
        .default(
          "30",
        ),
  });

router.use(
  requireAdmin,
);

router.get(
  "/overview",

  async (
    req,
    res,
    next,
  ) => {
    const parsed =
      querySchema.safeParse(
        req.query,
      );

    if (
      !parsed.success
    ) {
      res.status(400).json({
        success:
          false,

        message:
          "Choose a valid dashboard range.",
      });

      return;
    }

    const rangeDays =
      Number(
        parsed.data.range,
      );

    try {
      const [
        summaryResult,
        reportStatsResult,
        seriesResult,
        distributionResult,
        courseResult,
        performanceResult,
        activityResult,
        attentionResult,
        chatPresence,
      ] =
        await Promise.all([
          db.query(
            `
              WITH bounds AS (
                SELECT
                  NOW() - ($1::int * INTERVAL '1 day') AS current_start,
                  NOW() - ($1::int * 2 * INTERVAL '1 day') AS previous_start
              )
              SELECT
                (
                  SELECT COUNT(*)::int
                  FROM sales_representatives
                ) AS total_partners,

                (
                  SELECT COUNT(*)::int
                  FROM sales_representatives
                  WHERE is_active = TRUE
                ) AS active_partners,

                (
                  SELECT COUNT(*)::int
                  FROM sales_representatives representative, bounds
                  WHERE
                    representative.is_active = TRUE
                    AND (
                      representative.last_login_at >= bounds.current_start
                      OR EXISTS (
                        SELECT 1
                        FROM representative_reports report
                        WHERE
                          report.representative_id = representative.id
                          AND report.created_at >= bounds.current_start
                      )
                      OR EXISTS (
                        SELECT 1
                        FROM representative_training_lesson_progress progress
                        WHERE
                          progress.representative_id = representative.id
                          AND progress.updated_at >= bounds.current_start
                      )
                    )
                ) AS operational_partners,

                (
                  SELECT COUNT(*)::int
                  FROM sales_representative_applications application, bounds
                  WHERE application.created_at >= bounds.current_start
                ) AS applications_current,

                (
                  SELECT COUNT(*)::int
                  FROM sales_representative_applications application, bounds
                  WHERE
                    application.created_at >= bounds.previous_start
                    AND application.created_at < bounds.current_start
                ) AS applications_previous,

                (
                  SELECT COUNT(*)::int
                  FROM sales_representative_applications
                  WHERE status IN ('pending', 'reviewing')
                ) AS applications_pending,

                (
                  SELECT COUNT(*)::int
                  FROM representative_reports report, bounds
                  WHERE report.created_at >= bounds.current_start
                ) AS reports_current,

                (
                  SELECT COUNT(*)::int
                  FROM representative_reports report, bounds
                  WHERE
                    report.created_at >= bounds.previous_start
                    AND report.created_at < bounds.current_start
                ) AS reports_previous,

                (
                  SELECT COUNT(*)::int
                  FROM representative_reports
                  WHERE created_at >= CURRENT_DATE
                ) AS reports_today,

                (
                  SELECT COUNT(*)::int
                  FROM representative_reports
                  WHERE created_at >= NOW() - INTERVAL '7 days'
                ) AS reports_week,

                (
                  SELECT COUNT(*)::int
                  FROM representative_reports
                  WHERE admin_read_at IS NULL
                ) AS reports_unread,

                (
                  SELECT COUNT(*)::int
                  FROM representative_training_lesson_progress progress, bounds
                  WHERE
                    progress.completed = TRUE
                    AND progress.completed_at >= bounds.current_start
                ) AS completions_current,

                (
                  SELECT COUNT(*)::int
                  FROM representative_training_lesson_progress progress, bounds
                  WHERE
                    progress.completed = TRUE
                    AND progress.completed_at >= bounds.previous_start
                    AND progress.completed_at < bounds.current_start
                ) AS completions_previous,

                (
                  SELECT COUNT(*)::int
                  FROM training_courses
                  WHERE status = 'published'
                ) AS published_courses,

                (
                  SELECT COUNT(*)::int
                  FROM partner_programs
                  WHERE
                    status NOT IN ('draft', 'archived', 'completed')
                    AND CURRENT_DATE BETWEEN start_date AND end_date
                ) AS active_programs
            `,
            [
              rangeDays,
            ],
          ),

          db.query(
            `
              WITH bounds AS (
                SELECT NOW() - ($1::int * INTERVAL '1 day') AS current_start
              ),
              reports AS (
                SELECT
                  report.id,
                  report.representative_id,
                  report.created_at,
                  first_reply.created_at AS first_reply_at
                FROM representative_reports report
                CROSS JOIN bounds
                LEFT JOIN LATERAL (
                  SELECT reply.created_at
                  FROM representative_report_replies reply
                  WHERE reply.report_id = report.id
                  ORDER BY reply.created_at ASC
                  LIMIT 1
                ) first_reply ON TRUE
                WHERE report.created_at >= bounds.current_start
              )
              SELECT
                COUNT(*)::int AS total,
                COUNT(DISTINCT representative_id)::int AS active_reporters,
                COUNT(*) FILTER (WHERE first_reply_at IS NOT NULL)::int AS replied,
                ROUND(
                  AVG(
                    EXTRACT(
                      EPOCH FROM (first_reply_at - created_at)
                    ) / 60
                  ) FILTER (WHERE first_reply_at IS NOT NULL)::numeric,
                  1
                ) AS average_reply_minutes
              FROM reports
            `,
            [
              rangeDays,
            ],
          ),

          db.query(
            `
              WITH days AS (
                SELECT GENERATE_SERIES(
                  CURRENT_DATE - ($1::int - 1),
                  CURRENT_DATE,
                  INTERVAL '1 day'
                )::date AS day
              )
              SELECT
                days.day,
                (
                  SELECT COUNT(*)::int
                  FROM representative_reports report
                  WHERE report.created_at >= days.day
                    AND report.created_at < days.day + INTERVAL '1 day'
                ) AS reports,
                (
                  SELECT COUNT(*)::int
                  FROM representative_training_lesson_progress progress
                  WHERE
                    progress.completed = TRUE
                    AND progress.completed_at >= days.day
                    AND progress.completed_at < days.day + INTERVAL '1 day'
                ) AS lesson_completions,
                (
                  SELECT COUNT(*)::int
                  FROM sales_representative_applications application
                  WHERE application.created_at >= days.day
                    AND application.created_at < days.day + INTERVAL '1 day'
                ) AS applications
              FROM days
              ORDER BY days.day ASC
            `,
            [
              rangeDays,
            ],
          ),

          db.query(
            `
              WITH published_lessons AS (
                SELECT lesson.id
                FROM training_lessons lesson
                INNER JOIN training_sections section
                  ON section.id = lesson.section_id
                INNER JOIN training_courses course
                  ON course.id = section.course_id
                WHERE course.status = 'published'
              ),
              lesson_total AS (
                SELECT COUNT(*)::int AS total
                FROM published_lessons
              ),
              partner_progress AS (
                SELECT
                  representative.id,
                  CASE
                    WHEN lesson_total.total = 0 THEN 0
                    ELSE ROUND(
                      100.0 * COUNT(progress.lesson_id) FILTER (
                        WHERE progress.completed = TRUE
                      ) / lesson_total.total
                    )::int
                  END AS percent
                FROM sales_representatives representative
                CROSS JOIN lesson_total
                LEFT JOIN representative_training_lesson_progress progress
                  ON
                    progress.representative_id = representative.id
                    AND progress.lesson_id IN (
                      SELECT id
                      FROM published_lessons
                    )
                WHERE representative.is_active = TRUE
                GROUP BY representative.id, lesson_total.total
              )
              SELECT
                CASE
                  WHEN percent = 100 THEN 'complete'
                  WHEN percent >= 75 THEN '75-99'
                  WHEN percent >= 50 THEN '50-74'
                  WHEN percent >= 1 THEN '1-49'
                  ELSE 'not-started'
                END AS bucket,
                COUNT(*)::int AS partners
              FROM partner_progress
              GROUP BY bucket
            `,
          ),

          db.query(
            `
              WITH active_partners AS (
                SELECT COUNT(*)::int AS total
                FROM sales_representatives
                WHERE is_active = TRUE
              ),
              course_lessons AS (
                SELECT
                  course.id,
                  course.title_en,
                  course.title_am,
                  course.sort_order,
                  COUNT(lesson.id)::int AS lessons
                FROM training_courses course
                LEFT JOIN training_sections section
                  ON section.course_id = course.id
                LEFT JOIN training_lessons lesson
                  ON lesson.section_id = section.id
                WHERE course.status = 'published'
                GROUP BY course.id
              )
              SELECT
                course.id,
                course.title_en,
                course.title_am,
                course.lessons,
                COUNT(progress.id) FILTER (
                  WHERE progress.completed = TRUE
                )::int AS completed_lessons,
                CASE
                  WHEN course.lessons = 0 OR active_partners.total = 0 THEN 0
                  ELSE ROUND(
                    100.0 * COUNT(progress.id) FILTER (
                      WHERE progress.completed = TRUE
                    ) / (course.lessons * active_partners.total)
                  )::int
                END AS completion_percent
              FROM course_lessons course
              CROSS JOIN active_partners
              LEFT JOIN training_sections section
                ON section.course_id = course.id
              LEFT JOIN training_lessons lesson
                ON lesson.section_id = section.id
              LEFT JOIN representative_training_lesson_progress progress
                ON progress.lesson_id = lesson.id
              GROUP BY
                course.id,
                course.title_en,
                course.title_am,
                course.lessons,
                course.sort_order,
                active_partners.total
              ORDER BY completion_percent DESC, course.sort_order ASC
            `,
          ),

          db.query(
            `
              WITH bounds AS (
                SELECT NOW() - ($1::int * INTERVAL '1 day') AS current_start
              ),
              published_lessons AS (
                SELECT COUNT(lesson.id)::int AS total
                FROM training_lessons lesson
                INNER JOIN training_sections section
                  ON section.id = lesson.section_id
                INNER JOIN training_courses course
                  ON course.id = section.course_id
                WHERE course.status = 'published'
              )
              SELECT
                representative.id,
                COALESCE(
                  NULLIF(TRIM(representative.display_name), ''),
                  representative.name
                ) AS name,
                representative.username,
                representative.last_login_at,
                (
                  SELECT COUNT(*)::int
                  FROM representative_reports report, bounds
                  WHERE
                    report.representative_id = representative.id
                    AND report.created_at >= bounds.current_start
                ) AS reports,
                (
                  SELECT COUNT(*)::int
                  FROM representative_training_lesson_progress progress, bounds
                  WHERE
                    progress.representative_id = representative.id
                    AND progress.completed = TRUE
                    AND progress.completed_at >= bounds.current_start
                ) AS lesson_completions,
                CASE
                  WHEN published_lessons.total = 0 THEN 0
                  ELSE ROUND(
                    100.0 * (
                      SELECT COUNT(*)
                      FROM representative_training_lesson_progress progress
                      INNER JOIN training_lessons lesson
                        ON lesson.id = progress.lesson_id
                      INNER JOIN training_sections section
                        ON section.id = lesson.section_id
                      INNER JOIN training_courses course
                        ON course.id = section.course_id
                      WHERE
                        progress.representative_id = representative.id
                        AND progress.completed = TRUE
                        AND course.status = 'published'
                    ) / published_lessons.total
                  )::int
                END AS training_percent,
                GREATEST(
                  representative.last_login_at,
                  (
                    SELECT MAX(report.created_at)
                    FROM representative_reports report
                    WHERE report.representative_id = representative.id
                  ),
                  (
                    SELECT MAX(progress.updated_at)
                    FROM representative_training_lesson_progress progress
                    WHERE progress.representative_id = representative.id
                  ),
                  (
                    SELECT MAX(message.created_at)
                    FROM partner_chat_messages message
                    WHERE message.representative_id = representative.id
                  )
                ) AS last_activity_at
              FROM sales_representatives representative
              CROSS JOIN published_lessons
              WHERE representative.is_active = TRUE
              ORDER BY
                reports DESC,
                lesson_completions DESC,
                last_activity_at DESC NULLS LAST,
                representative.created_at ASC
              LIMIT 20
            `,
            [
              rangeDays,
            ],
          ),

          db.query(
            `
              SELECT *
              FROM (
                SELECT
                  'application_submitted'::text AS type,
                  application.id::text AS entity_id,
                  application.full_name AS representative_name,
                  ('APP-' || application.application_number::text) AS subject,
                  application.created_at
                FROM sales_representative_applications application

                UNION ALL

                SELECT
                  'report_created'::text,
                  report.id::text,
                  COALESCE(
                    NULLIF(TRIM(representative.display_name), ''),
                    representative.name
                  ),
                  LEFT(report.message, 120),
                  report.created_at
                FROM representative_reports report
                INNER JOIN sales_representatives representative
                  ON representative.id = report.representative_id

                UNION ALL

                SELECT
                  'report_replied'::text,
                  report.id::text,
                  COALESCE(
                    NULLIF(TRIM(representative.display_name), ''),
                    representative.name
                  ),
                  LEFT(reply.message, 120),
                  reply.created_at
                FROM representative_report_replies reply
                INNER JOIN representative_reports report
                  ON report.id = reply.report_id
                INNER JOIN sales_representatives representative
                  ON representative.id = report.representative_id

                UNION ALL

                SELECT
                  'lesson_completed'::text,
                  lesson.id::text,
                  COALESCE(
                    NULLIF(TRIM(representative.display_name), ''),
                    representative.name
                  ),
                  lesson.title_en,
                  progress.completed_at
                FROM representative_training_lesson_progress progress
                INNER JOIN sales_representatives representative
                  ON representative.id = progress.representative_id
                INNER JOIN training_lessons lesson
                  ON lesson.id = progress.lesson_id
                WHERE
                  progress.completed = TRUE
                  AND progress.completed_at IS NOT NULL

                UNION ALL

                SELECT
                  event.event_type::text,
                  event.id::text,
                  COALESCE(
                    NULLIF(TRIM(representative.display_name), ''),
                    representative.name,
                    admin.name
                  ),
                  COALESCE(
                    event.metadata ->> 'label',
                    event.metadata ->> 'status',
                    event.event_type
                  ),
                  event.created_at
                FROM partner_activity_events event
                LEFT JOIN sales_representatives representative
                  ON representative.id = event.representative_id
                LEFT JOIN admins admin
                  ON admin.id = event.admin_user_id
                WHERE event.event_type <> 'lesson_completed'
              ) activity
              WHERE activity.created_at IS NOT NULL
              ORDER BY activity.created_at DESC
              LIMIT 24
            `,
          ),

          db.query(
            `
              SELECT *
              FROM (
                SELECT
                  'high'::text AS severity,
                  'pending_application'::text AS type,
                  application.id::text AS entity_id,
                  application.full_name AS label,
                  application.created_at,
                  '/admin/applications'::text AS href
                FROM sales_representative_applications application
                WHERE
                  application.status IN ('pending', 'reviewing')
                  AND application.created_at < NOW() - INTERVAL '3 days'

                UNION ALL

                SELECT
                  'high'::text,
                  'unread_report'::text,
                  report.id::text,
                  COALESCE(
                    NULLIF(TRIM(representative.display_name), ''),
                    representative.name
                  ),
                  report.created_at,
                  '/admin/reports'::text
                FROM representative_reports report
                INNER JOIN sales_representatives representative
                  ON representative.id = report.representative_id
                WHERE
                  report.admin_read_at IS NULL
                  AND report.created_at < NOW() - INTERVAL '24 hours'

                UNION ALL

                SELECT
                  'high'::text,
                  'unanswered_report'::text,
                  report.id::text,
                  COALESCE(
                    NULLIF(TRIM(representative.display_name), ''),
                    representative.name
                  ),
                  report.created_at,
                  '/admin/reports'::text
                FROM representative_reports report
                INNER JOIN sales_representatives representative
                  ON representative.id = report.representative_id
                WHERE
                  report.admin_read_at IS NOT NULL
                  AND report.created_at < NOW() - INTERVAL '24 hours'
                  AND NOT EXISTS (
                    SELECT 1
                    FROM representative_report_replies reply
                    WHERE reply.report_id = report.id
                  )

                UNION ALL

                SELECT
                  'medium'::text,
                  'partner_without_report'::text,
                  representative.id::text,
                  COALESCE(
                    NULLIF(TRIM(representative.display_name), ''),
                    representative.name
                  ),
                  COALESCE(
                    (
                      SELECT MAX(report.created_at)
                      FROM representative_reports report
                      WHERE report.representative_id = representative.id
                    ),
                    representative.created_at
                  ),
                  '/admin/applications'::text
                FROM sales_representatives representative
                WHERE
                  representative.is_active = TRUE
                  AND NOT EXISTS (
                    SELECT 1
                    FROM representative_reports report
                    WHERE
                      report.representative_id = representative.id
                      AND report.created_at >= NOW() - INTERVAL '7 days'
                  )

                UNION ALL

                SELECT
                  'medium'::text,
                  'program_needs_setup'::text,
                  program.id::text,
                  program.title,
                  program.updated_at,
                  ('/admin/programs/' || program.id::text)::text
                FROM partner_programs program
                WHERE
                  program.status IN ('scheduled', 'active')
                  AND (
                    NOT EXISTS (
                      SELECT 1
                      FROM partner_program_targets target
                      WHERE target.program_id = program.id
                    )
                    OR (
                      program.assignment_scope = 'selected'
                      AND NOT EXISTS (
                        SELECT 1
                        FROM partner_program_assignments assignment
                        WHERE assignment.program_id = program.id
                      )
                    )
                  )

                UNION ALL

                SELECT
                  'medium'::text,
                  'program_ending_soon'::text,
                  program.id::text,
                  program.title,
                  program.end_date::timestamp,
                  ('/admin/programs/' || program.id::text)::text
                FROM partner_programs program
                WHERE
                  program.status NOT IN ('draft', 'completed', 'archived')
                  AND program.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 2
              ) attention
              ORDER BY
                CASE severity WHEN 'high' THEN 0 ELSE 1 END,
                created_at ASC
              LIMIT 20
            `,
          ),

          getPartnerChatOnlineSummary(),
        ]);

      const summary =
        summaryResult.rows[0] ??
        {};

      const reportStats =
        reportStatsResult.rows[0] ??
        {};

      const distribution =
        new Map(
          distributionResult.rows.map(
            (
              row,
            ) => [
              row.bucket,
              Number(
                row.partners,
              ),
            ],
          ),
        );

      const activeReporters =
        Number(
          reportStats.active_reporters ??
            0,
        );

      const reportTotal =
        Number(
          reportStats.total ??
            0,
        );

      res.json({
        success:
          true,

        rangeDays,

        generatedAt:
          new Date().toISOString(),

        capabilities: {
          leads: {
            available:
              false,

            reason:
              "This system has no dedicated lead entity. A legacy report category is not treated as a reliable lead pipeline.",
          },

          liveChatPresence:
            chatPresence !==
            null,
        },

        metrics: {
          totalPartners:
            Number(
              summary.total_partners ??
                0,
            ),

          activePartners:
            Number(
              summary.active_partners ??
                0,
            ),

          operationalPartners:
            Number(
              summary.operational_partners ??
                0,
            ),

          applications: {
            current:
              Number(
                summary.applications_current ??
                  0,
              ),

            previous:
              Number(
                summary.applications_previous ??
                  0,
              ),

            pending:
              Number(
                summary.applications_pending ??
                  0,
              ),
          },

          reports: {
            today:
              Number(
                summary.reports_today ??
                  0,
              ),

            week:
              Number(
                summary.reports_week ??
                  0,
              ),

            current:
              Number(
                summary.reports_current ??
                  0,
              ),

            previous:
              Number(
                summary.reports_previous ??
                  0,
              ),

            unread:
              Number(
                summary.reports_unread ??
                  0,
              ),
          },

          lessonCompletions: {
            current:
              Number(
                summary.completions_current ??
                  0,
              ),

            previous:
              Number(
                summary.completions_previous ??
                  0,
              ),
          },

          publishedCourses:
            Number(
              summary.published_courses ??
                0,
            ),

          activePrograms:
            Number(
              summary.active_programs ??
                0,
            ),

          onlinePartners:
            chatPresence
              ?.onlinePartners ??
            null,
        },

        reportStats: {
          total:
            reportTotal,

          activeReporters,

          averagePerActivePartner:
            activeReporters >
            0
              ? Number(
                  (
                    reportTotal /
                    activeReporters
                  ).toFixed(
                    1,
                  ),
                )
              : 0,

          replied:
            Number(
              reportStats.replied ??
                0,
            ),

          averageReplyMinutes:
            reportStats.average_reply_minutes ===
            null
              ? null
              : Number(
                  reportStats.average_reply_minutes,
                ),
        },

        activitySeries:
          seriesResult.rows.map(
            (
              row,
            ) => ({
              date:
                row.day,

              reports:
                Number(
                  row.reports,
                ),

              lessonCompletions:
                Number(
                  row.lesson_completions,
                ),

              applications:
                Number(
                  row.applications,
                ),
            }),
          ),

        training: {
          distribution: [
            "not-started",
            "1-49",
            "50-74",
            "75-99",
            "complete",
          ].map(
            (
              bucket,
            ) => ({
              bucket,

              partners:
                distribution.get(
                  bucket,
                ) ??
                0,
            }),
          ),

          courses:
            courseResult.rows.map(
              (
                row,
              ) => ({
                id:
                  row.id,

                titleEn:
                  row.title_en,

                titleAm:
                  row.title_am,

                lessons:
                  Number(
                    row.lessons,
                  ),

                completedLessons:
                  Number(
                    row.completed_lessons,
                  ),

                completionPercent:
                  Number(
                    row.completion_percent,
                  ),
              }),
            ),
        },

        partnerPerformance:
          performanceResult.rows.map(
            (
              row,
            ) => ({
              id:
                row.id,

              name:
                row.name,

              partnerId:
                row.username,

              reports:
                Number(
                  row.reports,
                ),

              lessonCompletions:
                Number(
                  row.lesson_completions,
                ),

              trainingPercent:
                Number(
                  row.training_percent,
                ),

              lastActivityAt:
                row.last_activity_at ??
                null,
            }),
          ),

        recentActivity:
          activityResult.rows.map(
            (
              row,
            ) => ({
              type:
                row.type,

              entityId:
                row.entity_id,

              representativeName:
                row.representative_name ??
                null,

              subject:
                row.subject,

              createdAt:
                row.created_at,
            }),
          ),

        attention:
          attentionResult.rows.map(
            (
              row,
            ) => ({
              severity:
                row.severity,

              type:
                row.type,

              entityId:
                row.entity_id,

              label:
                row.label,

              createdAt:
                row.created_at,

              href:
                row.href,
            }),
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

export default router;
