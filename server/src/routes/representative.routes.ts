import {
  Router,
} from "express";

import {
  z,
} from "zod";

import {
  rateLimit,
} from "../middleware/rate-limit.middleware.js";

import {
  db,
} from "../config/db.js";

import {
  requireRepresentative,
  requireRepresentativeReady,
} from "../middleware/representative-auth.middleware.js";

import {
  sendNewPartnerReportAdminEmail,
} from "../services/application-email.service.js";

import {
  emitAdminReportsChanged,
} from "../socket/partner-chat.socket.js";

/* =========================================================
   ROUTER
   ========================================================= */

const router =
  Router();

const reportWriteRateLimit =
  rateLimit({
    windowMs:
      15 *
      60 *
      1000,

    limit:
      20,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      success:
        false,

      message: {
        en:
          "Too many report attempts. Please try again later.",

        am:
          "ብዙ ጊዜ ሪፖርት ለመላክ ሞክረዋል። እባክዎ ቆይተው ይሞክሩ።",
      },
    },
  });

/*
  Every route below requires:
  1. valid representative JWT
  2. active representative account
  3. completed temporary-password change
*/

router.use(
  requireRepresentative,
  requireRepresentativeReady,
);

/* =========================================================
   HELPERS
   ========================================================= */

function mapReport(
  row:
    Record<
      string,
      unknown
    >,
) {
  return {
    id:
      row.id,

    message:
      row.message,

    adminReadAt:
      row.admin_read_at ??
      null,

    replies:
      Array.isArray(
        row.replies,
      )
        ? row.replies
        : [],

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

async function createReportWithCooldown(
  representativeId:
    string,

  message:
    string,
) {
  const client =
    await db.connect();

  let transactionOpen =
    false;

  try {
    await client.query(
      "BEGIN",
    );

    transactionOpen =
      true;

    /*
      Serialize report creation on the authenticated owner row.
      The cooldown is therefore enforced against database time
      even if concurrent requests reach different server workers.
    */

    await client.query(
      `
        SELECT id
        FROM sales_representatives
        WHERE
          id = $1
          AND is_active = TRUE
        FOR UPDATE
      `,
      [
        representativeId,
      ],
    );

    const cooldownResult =
      await client.query(
        `
          SELECT
            created_at + INTERVAL '2 hours' AS next_report_at,
            GREATEST(
              0,
              CEIL(
                EXTRACT(
                  EPOCH FROM (
                    created_at + INTERVAL '2 hours' - NOW()
                  )
                )
              )
            )::int AS remaining_seconds
          FROM representative_reports
          WHERE representative_id = $1
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [
          representativeId,
        ],
      );

    const cooldown =
      cooldownResult.rows[0];

    const remainingSeconds =
      Number(
        cooldown
          ?.remaining_seconds ??
          0,
      );

    if (
      remainingSeconds >
      0
    ) {
      await client.query(
        "ROLLBACK",
      );

      transactionOpen =
        false;

      return {
        created:
          false as const,

        remainingSeconds,

        nextReportAt:
          cooldown
            .next_report_at,
      };
    }

    const result =
      await client.query(
        `
          INSERT INTO representative_reports (
            representative_id,
            message
          )
          VALUES (
            $1,
            $2
          )
          RETURNING
            id,
            message,
            admin_read_at,
            created_at,
            updated_at
        `,
        [
          representativeId,
          message,
        ],
      );

    await client.query(
      "COMMIT",
    );

    transactionOpen =
      false;

    return {
      created:
        true as const,

      result,
    };
  } catch (
    error
  ) {
    if (
      transactionOpen
    ) {
      await client.query(
        "ROLLBACK",
      );
    }

    throw error;
  } finally {
    client.release();
  }
}

async function notifyAdminOfNewReport(
  input: {
    reportId:
      string;

    representativeId:
      string;

    createdAt:
      Date;

    reportMessage:
      string;
  },
) {
  try {
    const [
      adminResult,
      representativeResult,
    ] =
      await Promise.all([
        db.query(
          `
            SELECT
              name,
              email
            FROM admins
            WHERE
              is_active = TRUE
              AND NULLIF(TRIM(email), '') IS NOT NULL
            ORDER BY created_at ASC
            LIMIT 1
          `,
        ),

        db.query(
          `
            SELECT
              COALESCE(
                NULLIF(TRIM(display_name), ''),
                name
              ) AS name,
              username
            FROM sales_representatives
            WHERE id = $1::uuid
            LIMIT 1
          `,
          [
            input.representativeId,
          ],
        ),
      ]);

    const admin =
      adminResult.rows[0];

    const representative =
      representativeResult.rows[0];

    if (
      !admin ||
      !representative
    ) {
      return;
    }

    const sent =
      await sendNewPartnerReportAdminEmail({
        reportId:
          input.reportId,

        adminEmail:
          admin.email,

        adminName:
          admin.name,

        representativeName:
          representative.name,

        partnerId:
          representative.username,

        reportMessage:
          input.reportMessage,

        createdAt:
          input.createdAt,
      });

    if (
      sent
    ) {
      await db.query(
        `
          UPDATE representative_reports
          SET admin_notification_sent_at = NOW()
          WHERE
            id = $1::uuid
            AND admin_notification_sent_at IS NULL
        `,
        [
          input.reportId,
        ],
      );
    }
  } catch (
    error
  ) {
    console.error(
      "New Partner report notification failed:",
      error instanceof
        Error
        ? error.message
        : "Unknown report notification error.",
    );
  }
}

/* =========================================================
   DASHBOARD
   ========================================================= */

router.get(
  "/dashboard",

  async (
    req,
    res,
    next,
  ) => {
    try {
      const representativeId =
        req.auth!.id;

      const [
        reportResult,
        trainingResult,
        recentResult,
      ] =
        await Promise.all([
          db.query(
            `
              SELECT
                COUNT(DISTINCT report.id)::int AS total,

                COUNT(reply.id)::int AS replies,

                COUNT(reply.id) FILTER (
                  WHERE reply.representative_read_at IS NULL
                )::int AS unread_replies

              FROM representative_reports report

              LEFT JOIN representative_report_replies reply
                ON reply.report_id = report.id

              WHERE report.representative_id = $1
            `,
            [
              representativeId,
            ],
          ),

          db.query(
  `
    SELECT
      COUNT(l.id)::int AS total,

      COUNT(l.id) FILTER (
        WHERE
          COALESCE(
            p.completed,
            FALSE
          ) = TRUE
      )::int AS completed

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
  `,
  [
    representativeId,
  ],
),

          db.query(
            `
              SELECT
                report.id,
                report.message,
                report.created_at,
                latest_reply.message AS latest_reply_message,
                latest_reply.created_at AS latest_reply_created_at,
                latest_reply.representative_read_at

              FROM representative_reports report

              LEFT JOIN LATERAL (
                SELECT
                  reply.message,
                  reply.created_at,
                  reply.representative_read_at
                FROM representative_report_replies reply
                WHERE reply.report_id = report.id
                ORDER BY reply.created_at DESC
                LIMIT 1
              ) latest_reply ON TRUE

              WHERE report.representative_id = $1
              ORDER BY report.created_at DESC
              LIMIT 5
            `,
            [
              representativeId,
            ],
          ),
        ]);

      const reports =
        reportResult.rows[0];

      const training =
        trainingResult.rows[0];

      res.json({
        success:
          true,

        dashboard: {
          reports: {
            total:
              Number(
                reports.total,
              ),

            replies:
              Number(
                reports.replies,
              ),

            unreadReplies:
              Number(
                reports.unread_replies,
              ),
          },

          training: {
            total:
              Number(
                training.total,
              ),

            completed:
              Number(
                training.completed,
              ),
          },

          recentReports:
            recentResult.rows.map(
              (
                row,
              ) => ({
                id:
                  row.id,

                message:
                  row.message,

                createdAt:
                  row.created_at,

                latestReply:
                  row.latest_reply_message
                    ? {
                        message:
                          row.latest_reply_message,

                        createdAt:
                          row.latest_reply_created_at,

                        readAt:
                          row.representative_read_at,
                      }
                    : null,
              }),
            ),
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
   REPORT VALIDATION
   ========================================================= */

const reportSchema =
  z.object({
    message:
      z
        .string()
        .trim()
        .min(1)
        .max(5000),
  });

/* =========================================================
   MY REPORTS

   CRITICAL:
   representative_id comes from req.auth.id.
   The frontend never chooses whose reports to query.
   ========================================================= */

router.get(
  "/reports",

  async (
    req,
    res,
    next,
  ) => {
    try {
      const representativeId =
        req.auth!.id;

      const [
        reportsResult,
        cooldownResult,
        unreadResult,
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

                COALESCE(
                  (
                    SELECT JSON_AGG(
                      JSON_BUILD_OBJECT(
                        'id', reply.id,
                        'message', reply.message,
                        'readAt', reply.representative_read_at,
                        'createdAt', reply.created_at,
                        'updatedAt', reply.updated_at
                      )
                      ORDER BY reply.created_at ASC
                    )
                    FROM representative_report_replies reply
                    WHERE reply.report_id = report.id
                  ),
                  '[]'::json
                ) AS replies

              FROM representative_reports report
              WHERE report.representative_id = $1
              ORDER BY report.created_at DESC
              LIMIT 200
            `,
            [
              representativeId,
            ],
          ),

          db.query(
            `
              SELECT
                MAX(created_at) AS last_report_at,

                CASE
                  WHEN MAX(created_at) IS NULL
                    THEN NULL
                  ELSE MAX(created_at) + INTERVAL '2 hours'
                END AS next_report_at,

                GREATEST(
                  0,
                  CEIL(
                    EXTRACT(
                      EPOCH FROM (
                        MAX(created_at) + INTERVAL '2 hours' - NOW()
                      )
                    )
                  )
                )::int AS remaining_seconds

              FROM representative_reports
              WHERE representative_id = $1
            `,
            [
              representativeId,
            ],
          ),

          db.query(
            `
              SELECT COUNT(*)::int AS unread_count
              FROM representative_report_replies reply
              INNER JOIN representative_reports report
                ON report.id = reply.report_id
              WHERE
                report.representative_id = $1
                AND reply.representative_read_at IS NULL
            `,
            [
              representativeId,
            ],
          ),
        ]);

      const cooldown =
        cooldownResult.rows[0];

      const remainingSeconds =
        Number(
          cooldown
            ?.remaining_seconds ??
            0,
        );

      res.json({
        success:
          true,

        reports:
          reportsResult.rows.map(
            mapReport,
          ),

        cooldown: {
          canSubmit:
            remainingSeconds <=
            0,

          lastReportAt:
            cooldown
              ?.last_report_at ??
            null,

          nextReportAt:
            cooldown
              ?.next_report_at ??
            null,

          remainingSeconds,
        },

        unreadReplyCount:
          Number(
            unreadResult.rows[0]
              ?.unread_count ??
              0,
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
   MARK MY ADMIN REPLIES READ
   ========================================================= */

router.post(
  "/reports/mark-replies-read",

  async (
    req,
    res,
    next,
  ) => {
    try {
      const result =
        await db.query(
          `
            UPDATE representative_report_replies reply
            SET
              representative_read_at = NOW(),
              updated_at = NOW()
            FROM representative_reports report
            WHERE
              report.id = reply.report_id
              AND report.representative_id = $1
              AND reply.representative_read_at IS NULL
            RETURNING reply.id
          `,
          [
            req.auth!.id,
          ],
        );

      res.json({
        success:
          true,

        markedRead:
          result.rowCount ??
          0,

        unreadReplyCount:
          0,
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
   CREATE REPORT
   ========================================================= */

router.post(
  "/reports",

  reportWriteRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    try {
      const parsed =
        reportSchema.safeParse(
          req.body,
        );

      if (
        !parsed.success
      ) {
        res
          .status(
            400,
          )
          .json({
            success:
              false,

            message: {
              en:
                "Write a report message and try again.",

              am:
                "የReport መረጃውን ያረጋግጡ እና ይሞክሩ።",
            },
          });

        return;
      }

      const creation =
        await createReportWithCooldown(
          req.auth!.id,
          parsed.data.message,
        );

      if (
        !creation.created
      ) {
        res.setHeader(
          "Retry-After",
          String(
            creation.remainingSeconds,
          ),
        );

        res
          .status(
            429,
          )
          .json({
            success:
              false,

            code:
              "REPORT_COOLDOWN",

            retryAfterSeconds:
              creation.remainingSeconds,

            nextReportAt:
              creation.nextReportAt,

            message: {
              en:
                "You can only send one report every two hours.",

              am:
                "በየሁለት ሰዓቱ አንድ ሪፖርት ብቻ መላክ ይችላሉ።",
            },
          });

        return;
      }

      const result =
        creation.result;

      const createdReport =
        result.rows[0];

      emitAdminReportsChanged({
        reportId:
          createdReport.id,

        createdAt:
          new Date(
            createdReport.created_at,
          ).toISOString(),
      });

      res
        .status(
          201,
        )
        .json({
          success:
            true,

          report:
            mapReport(
              createdReport,
            ),

          message: {
            en:
              "Report sent successfully.",

            am:
              "Report በተሳካ ሁኔታ ተልኳል።",
          },
        });

      // The success response is already committed. Waiting here keeps
      // serverless runtimes alive for delivery without coupling email
      // failure to the representative's saved report.
      await notifyAdminOfNewReport({
        reportId:
          createdReport.id,

        representativeId:
          req.auth!.id,

        createdAt:
          new Date(
            createdReport.created_at,
          ),

        reportMessage:
          createdReport.message,
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
   TRAINING
   ========================================================= */

router.get(
  "/training",

  async (
    req,
    res,
    next,
  ) => {
    try {
      const result =
        await db.query(
          `
            SELECT
              m.id,
              m.slug,
              m.title,
              m.description,
              m.content,
              m.video_url,
              m.duration_minutes,
              m.sort_order,
              m.is_required,

              COALESCE(
                p.progress_percent,
                0
              ) AS progress_percent,

              COALESCE(
                p.completed,
                FALSE
              ) AS completed,

              p.completed_at

            FROM representative_training_modules m

            LEFT JOIN representative_training_progress p
              ON
                p.module_id = m.id
                AND
                p.representative_id = $1

            WHERE
              m.is_published = TRUE

            ORDER BY
              m.sort_order ASC,
              m.created_at ASC
          `,
          [
            req.auth!.id,
          ],
        );

      res.json({
        success:
          true,

        modules:
          result.rows.map(
            (
              row,
            ) => ({
              id:
                row.id,

              slug:
                row.slug,

              title:
                row.title,

              description:
                row.description,

              content:
                row.content,

              videoUrl:
                row.video_url,

              durationMinutes:
                Number(
                  row.duration_minutes,
                ),

              required:
                Boolean(
                  row.is_required,
                ),

              progressPercent:
                Number(
                  row.progress_percent,
                ),

              completed:
                Boolean(
                  row.completed,
                ),

              completedAt:
                row.completed_at,
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

/* =========================================================
   COMPLETE TRAINING
   ========================================================= */

router.post(
  "/training/:id/complete",

  async (
    req,
    res,
    next,
  ) => {
    try {
      const parsedId =
        z
          .string()
          .uuid()
          .safeParse(
            req.params.id,
          );

      if (
        !parsedId.success
      ) {
        res
          .status(
            400,
          )
          .json({
            success:
              false,

            message: {
              en:
                "Invalid training module.",

              am:
                "Training module ትክክል አይደለም።",
            },
          });

        return;
      }

      const moduleResult =
        await db.query(
          `
            SELECT id
            FROM representative_training_modules
            WHERE
              id = $1
              AND
              is_published = TRUE
            LIMIT 1
          `,
          [
            parsedId.data,
          ],
        );

      if (
        moduleResult.rowCount ===
        0
      ) {
        res
          .status(
            404,
          )
          .json({
            success:
              false,

            message: {
              en:
                "Training module not found.",

              am:
                "Training module አልተገኘም።",
            },
          });

        return;
      }

      await db.query(
        `
          INSERT INTO representative_training_progress (
            representative_id,
            module_id,
            progress_percent,
            completed,
            completed_at,
            updated_at
          )
          VALUES (
            $1,
            $2,
            100,
            TRUE,
            NOW(),
            NOW()
          )

          ON CONFLICT (
            representative_id,
            module_id
          )
          DO UPDATE SET
            progress_percent = 100,
            completed = TRUE,
            completed_at =
              COALESCE(
                representative_training_progress.completed_at,
                NOW()
              ),
            updated_at = NOW()
        `,
        [
          req.auth!.id,

          parsedId.data,
        ],
      );

      res.json({
        success:
          true,

        message: {
          en:
            "Training completed.",

          am:
            "Training ተጠናቋል።",
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
   RESOURCES
   ========================================================= */

router.get(
  "/resources",

  async (
    _req,
    res,
    next,
  ) => {
    try {
      const result =
        await db.query(
          `
            SELECT
              id,
              slug,
              category,
              title,
              description,
              content,
              external_url
            FROM representative_resources
            WHERE
              is_published = TRUE
            ORDER BY
              sort_order ASC,
              created_at ASC
          `,
        );

      res.json({
        success:
          true,

        resources:
          result.rows.map(
            (
              row,
            ) => ({
              id:
                row.id,

              slug:
                row.slug,

              category:
                row.category,

              title:
                row.title,

              description:
                row.description,

              content:
                row.content,

              externalUrl:
                row.external_url,
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
