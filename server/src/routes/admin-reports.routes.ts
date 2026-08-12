import {
  Router,
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

const router =
  Router();

const writeRateLimit =
  rateLimit({
    windowMs:
      15 *
      60 *
      1000,

    limit:
      120,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      success:
        false,

      message: {
        en:
          "Too many report actions. Please try again later.",

        am:
          "ብዙ የሪፖርት እርምጃዎችን ሞክረዋል። እባክዎ ቆይተው ይሞክሩ።",
      },
    },
  });

const reportIdSchema =
  z.string().uuid();

const replySchema =
  z.object({
    message:
      z
        .string()
        .trim()
        .min(1)
        .max(5000),
  });

router.use(
  requireAdmin,
);

function mapAdminReport(
  row:
    Record<
      string,
      unknown
    >,
) {
  const replies =
    Array.isArray(
      row.replies,
    )
      ? row.replies
      : [];

  return {
    id:
      row.id,

    representative: {
      id:
        row.representative_id,

      name:
        row.representative_name,

      partnerId:
        row.representative_username,
    },

    message:
      row.message,

    adminReadAt:
      row.admin_read_at ??
      null,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    replied:
      replies.length >
      0,

    replies,

    latestReply:
      replies.length >
      0
        ? replies[
            replies.length -
              1
          ]
        : null,
  };
}

const adminReportSelect = `
  SELECT
    report.id,
    report.representative_id,
    report.message,
    report.admin_read_at,
    report.created_at,
    report.updated_at,

    representative.name AS representative_name,
    representative.username AS representative_username,

    COALESCE(
      (
        SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', reply.id,
            'message', reply.message,
            'adminUserId', reply.admin_user_id,
            'representativeReadAt', reply.representative_read_at,
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
  INNER JOIN sales_representatives representative
    ON representative.id = report.representative_id
`;

async function getAdminReport(
  reportId:
    string,
) {
  const result =
    await db.query(
      `
        ${adminReportSelect}
        WHERE report.id = $1
        LIMIT 1
      `,
      [
        reportId,
      ],
    );

  return result.rows[0]
    ? mapAdminReport(
        result.rows[0],
      )
    : null;
}

/* =========================================================
   LIST / UNREAD COUNT
   ========================================================= */

router.get(
  "/",

  async (
    _req,
    res,
    next,
  ) => {
    try {
      const [
        reportsResult,
        unreadResult,
      ] =
        await Promise.all([
          db.query(
            `
              ${adminReportSelect}
              ORDER BY
                (report.admin_read_at IS NULL) DESC,
                report.created_at DESC
              LIMIT 200
            `,
          ),

          db.query(
            `
              SELECT COUNT(*)::int AS unread_count
              FROM representative_reports
              WHERE admin_read_at IS NULL
            `,
          ),
        ]);

      res.json({
        success:
          true,

        reports:
          reportsResult.rows.map(
            mapAdminReport,
          ),

        unreadCount:
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

router.get(
  "/unread-count",

  async (
    _req,
    res,
    next,
  ) => {
    try {
      const result =
        await db.query(
          `
            SELECT COUNT(*)::int AS unread_count
            FROM representative_reports
            WHERE admin_read_at IS NULL
          `,
        );

      res.json({
        success:
          true,

        unreadCount:
          Number(
            result.rows[0]
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
   MARK REPORT READ
   ========================================================= */

router.post(
  "/:reportId/read",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    try {
      const parsedId =
        reportIdSchema.safeParse(
          req.params.reportId,
        );

      if (
        !parsedId.success
      ) {
        res.status(400).json({
          success:
            false,

          message: {
            en:
              "Invalid report.",

            am:
              "ሪፖርቱ ትክክል አይደለም።",
          },
        });

        return;
      }

      const updateResult =
        await db.query(
          `
            UPDATE representative_reports
            SET
              admin_read_at = COALESCE(
                admin_read_at,
                NOW()
              ),
              updated_at = NOW()
            WHERE id = $1
            RETURNING id
          `,
          [
            parsedId.data,
          ],
        );

      if (
        updateResult.rowCount ===
        0
      ) {
        res.status(404).json({
          success:
            false,

          message: {
            en:
              "Report not found.",

            am:
              "ሪፖርቱ አልተገኘም።",
          },
        });

        return;
      }

      const report =
        await getAdminReport(
          parsedId.data,
        );

      res.json({
        success:
          true,

        report,
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
   REPLY
   ========================================================= */

router.post(
  "/:reportId/replies",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    try {
      const parsedId =
        reportIdSchema.safeParse(
          req.params.reportId,
        );

      const parsedBody =
        replySchema.safeParse(
          req.body,
        );

      if (
        !parsedId.success ||
        !parsedBody.success
      ) {
        res.status(400).json({
          success:
            false,

          message: {
            en:
              "Enter a valid reply.",

            am:
              "ትክክለኛ ምላሽ ያስገቡ።",
          },
        });

        return;
      }

      const insertResult =
        await db.query(
          `
            WITH target_report AS (
              UPDATE representative_reports
              SET
                admin_read_at = COALESCE(
                  admin_read_at,
                  NOW()
                ),
                updated_at = NOW()
              WHERE id = $1
              RETURNING id
            )

            INSERT INTO representative_report_replies (
              report_id,
              admin_user_id,
              message
            )
            SELECT
              target_report.id,
              $2,
              $3
            FROM target_report
            RETURNING id
          `,
          [
            parsedId.data,
            req.auth!.id,
            parsedBody.data.message,
          ],
        );

      if (
        insertResult.rowCount ===
        0
      ) {
        res.status(404).json({
          success:
            false,

          message: {
            en:
              "Report not found.",

            am:
              "ሪፖርቱ አልተገኘም።",
          },
        });

        return;
      }

      const report =
        await getAdminReport(
          parsedId.data,
        );

      res.status(201).json({
        success:
          true,

        report,

        message: {
          en:
            "Reply sent.",

          am:
            "ምላሹ ተልኳል።",
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
