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
  requireRepresentative,
  requireRepresentativeReady,
} from "../middleware/representative-auth.middleware.js";

/* =========================================================
   ROUTER
   ========================================================= */

const router =
  Router();

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

    category:
      row.category,

    title:
      row.title,

    businessName:
      row.business_name,

    contactName:
      row.contact_name,

    clientPhone:
      row.client_phone,

    clientEmail:
      row.client_email,

    estimatedBudget:
      row.estimated_budget ===
        null
        ? null
        : Number(
            row.estimated_budget,
          ),

    details:
      row.details,

    status:
      row.status,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
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
                COUNT(*)::int AS total,

                COUNT(*) FILTER (
                  WHERE status IN (
                    'submitted',
                    'reviewing',
                    'contacted',
                    'qualified'
                  )
                )::int AS active,

                COUNT(*) FILTER (
                  WHERE status = 'won'
                )::int AS won
              FROM representative_reports
              WHERE representative_id = $1
            `,
            [
              representativeId,
            ],
          ),

          db.query(
            `
              SELECT
                COUNT(m.id)::int AS total,

                COUNT(m.id) FILTER (
                  WHERE
                    COALESCE(
                      p.completed,
                      FALSE
                    ) = TRUE
                )::int AS completed
              FROM representative_training_modules m

              LEFT JOIN representative_training_progress p
                ON
                  p.module_id = m.id
                  AND
                  p.representative_id = $1

              WHERE
                m.is_published = TRUE
            `,
            [
              representativeId,
            ],
          ),

          db.query(
            `
              SELECT
                id,
                category,
                title,
                business_name,
                status,
                created_at
              FROM representative_reports
              WHERE representative_id = $1
              ORDER BY created_at DESC
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

            active:
              Number(
                reports.active,
              ),

            won:
              Number(
                reports.won,
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

                category:
                  row.category,

                title:
                  row.title,

                businessName:
                  row.business_name,

                status:
                  row.status,

                createdAt:
                  row.created_at,
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
    category:
      z.enum([
        "lead",
        "follow_up",
        "meeting",
        "issue",
        "other",
      ]),

    title:
      z
        .string()
        .trim()
        .min(3)
        .max(160),

    businessName:
      z
        .string()
        .trim()
        .min(2)
        .max(180),

    contactName:
      z
        .string()
        .trim()
        .max(160)
        .optional()
        .default(
          "",
        ),

    clientPhone:
      z
        .string()
        .trim()
        .max(40)
        .optional()
        .default(
          "",
        ),

    clientEmail:
      z
        .union([
          z
            .string()
            .trim()
            .email()
            .max(255),

          z.literal(
            "",
          ),
        ])
        .optional()
        .default(
          "",
        ),

    estimatedBudget:
      z
        .number()
        .nonnegative()
        .max(
          100_000_000,
        )
        .nullable()
        .optional(),

    details:
      z
        .string()
        .trim()
        .min(20)
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
      const result =
        await db.query(
          `
            SELECT
              id,
              category,
              title,
              business_name,
              contact_name,
              client_phone,
              client_email,
              estimated_budget,
              details,
              status,
              created_at,
              updated_at
            FROM representative_reports
            WHERE representative_id = $1
            ORDER BY created_at DESC
            LIMIT 200
          `,
          [
            req.auth!.id,
          ],
        );

      res.json({
        success:
          true,

        reports:
          result.rows.map(
            mapReport,
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
   CREATE REPORT
   ========================================================= */

router.post(
  "/reports",

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
                "Check the report information and try again.",

              am:
                "የReport መረጃውን ያረጋግጡ እና ይሞክሩ።",
            },
          });

        return;
      }

      const input =
        parsed.data;

      const result =
        await db.query(
          `
            INSERT INTO representative_reports (
              representative_id,

              category,
              title,

              business_name,
              contact_name,

              client_phone,
              client_email,

              estimated_budget,

              details,

              status
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

              'submitted'
            )
            RETURNING
              id,
              category,
              title,
              business_name,
              contact_name,
              client_phone,
              client_email,
              estimated_budget,
              details,
              status,
              created_at,
              updated_at
          `,
          [
            /*
              Ownership ALWAYS comes from authenticated JWT.
            */

            req.auth!.id,

            input.category,

            input.title,

            input.businessName,

            input.contactName ||
              null,

            input.clientPhone ||
              null,

            input.clientEmail ||
              null,

            input
              .estimatedBudget ??
              null,

            input.details,
          ],
        );

      res
        .status(
          201,
        )
        .json({
          success:
            true,

          report:
            mapReport(
              result.rows[0],
            ),

          message: {
            en:
              "Report submitted successfully.",

            am:
              "Report በተሳካ ሁኔታ ተልኳል።",
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