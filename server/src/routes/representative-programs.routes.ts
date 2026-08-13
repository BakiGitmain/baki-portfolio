import { Router, type Response } from "express";
import { z } from "zod";

import { db } from "../config/db.js";
import {
  requireRepresentative,
  requireRepresentativeReady,
} from "../middleware/representative-auth.middleware.js";
import { rateLimit } from "../middleware/rate-limit.middleware.js";
import { sendNewProgramSubmissionAdminEmail } from "../services/application-email.service.js";
import {
  createProgramSubmission,
  getRepresentativeProgramNotificationCount,
  listRepresentativePrograms,
  markRepresentativeProgramNotificationsRead,
  ProgramOperationError,
} from "../services/partner-program.service.js";

const router = Router();
const uuidSchema = z.string().uuid();
const submissionSchema = z
  .object({
    businessName: z.string().trim().max(180).optional(),
    contactName: z.string().trim().max(160).optional(),
    contactMethod: z.string().trim().max(255).optional(),
    businessType: z.string().trim().max(120).optional(),
    needSummary: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(5000).optional(),
    explanation: z.string().trim().max(5000).optional(),
    publicUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
  })
  .strict();

const submissionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(requireRepresentative, requireRepresentativeReady);

function sendOperationError(res: Response, error: unknown) {
  if (!(error instanceof ProgramOperationError)) return false;
  res.status(error.status).json({
    success: false,
    code: error.code,
    message: {
      en: error.message,
      am: error.message,
    },
  });
  return true;
}

async function notifyAdmin(submissionId: string) {
  try {
    const result = await db.query(
      `
        SELECT
          submission.id,
          submission.business_name,
          submission.need_summary,
          submission.contact_method,
          submission.notes,
          program.title AS program_title,
          COALESCE(NULLIF(TRIM(representative.display_name), ''), representative.name) AS representative_name,
          representative.username AS partner_id,
          admin.name AS admin_name,
          admin.email AS admin_email
        FROM partner_program_submissions submission
        INNER JOIN partner_programs program ON program.id = submission.program_id
        INNER JOIN sales_representatives representative ON representative.id = submission.representative_id
        CROSS JOIN LATERAL (
          SELECT name, email
          FROM admins
          WHERE is_active = TRUE AND NULLIF(TRIM(email), '') IS NOT NULL
          ORDER BY created_at
          LIMIT 1
        ) admin
        WHERE submission.id = $1::uuid
          AND program.deleted_at IS NULL
          AND submission.status = 'pending'
          AND submission.admin_notification_sent_at IS NULL
        LIMIT 1
      `,
      [submissionId],
    );
    const submission = result.rows[0];
    if (!submission) return;

    const sent = await sendNewProgramSubmissionAdminEmail({
      submissionId,
      adminEmail: submission.admin_email,
      adminName: submission.admin_name,
      programTitle: submission.program_title,
      representativeName: submission.representative_name,
      partnerId: submission.partner_id,
      businessName: submission.business_name ?? null,
      needSummary: submission.need_summary ?? null,
      contactMethod: submission.contact_method ?? null,
      notes: submission.notes ?? "",
    });
    if (sent) {
      await db.query(
        `UPDATE partner_program_submissions SET admin_notification_sent_at = NOW() WHERE id = $1::uuid AND admin_notification_sent_at IS NULL`,
        [submissionId],
      );
    }
  } catch (error) {
    console.error(
      "New Program submission notification failed:",
      error instanceof Error ? error.message : "Unknown Program email error.",
    );
  }
}

router.get("/", async (req, res, next) => {
  try {
    const [programs, notificationUnreadCount] = await Promise.all([
      listRepresentativePrograms(req.auth!.id, { activeOnly: false }),
      getRepresentativeProgramNotificationCount(req.auth!.id),
    ]);
    res.json({ success: true, programs, notificationUnreadCount });
  } catch (error) {
    next(error);
  }
});

router.get("/notifications/unread-count", async (req, res, next) => {
  try {
    res.json({
      success: true,
      unreadCount: await getRepresentativeProgramNotificationCount(req.auth!.id),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/notifications/read", async (req, res, next) => {
  try {
    res.json({
      success: true,
      markedRead: await markRepresentativeProgramNotificationsRead(req.auth!.id),
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/:programId/targets/:targetId/submissions",
  submissionRateLimit,
  async (req, res, next) => {
    const programId = uuidSchema.safeParse(req.params.programId);
    const targetId = uuidSchema.safeParse(req.params.targetId);
    const input = submissionSchema.safeParse(req.body);
    if (!programId.success || !targetId.success || !input.success) {
      return void res.status(400).json({
        success: false,
        message: {
          en: "Check the submission details and try again.",
          am: "የማስረጃውን መረጃ አረጋግጠው እንደገና ይሞክሩ።",
        },
      });
    }

    try {
      const submission = await createProgramSubmission(
        req.auth!.id,
        programId.data,
        targetId.data,
        input.data,
      );
      res.status(201).json({
        success: true,
        submission,
        message: {
          en:
            submission.status === "approved"
              ? "Lead recorded and progress updated."
              : "Submitted for admin review.",
          am:
            submission.status === "approved"
              ? "መረጃው ተመዝግቦ እድገትዎ ተዘምኗል።"
              : "ለአስተዳዳሪ ምርመራ ተልኳል።",
        },
      });

      if (submission.status === "pending") await notifyAdmin(submission.id);
    } catch (error) {
      if (!sendOperationError(res, error)) next(error);
    }
  },
);

export default router;
