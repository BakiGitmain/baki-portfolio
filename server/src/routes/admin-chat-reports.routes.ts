import {
  Router,
} from "express";

import {
  z,
} from "zod";

import {
  requireAdmin,
} from "../middleware/auth.middleware.js";

import {
  getAdminPartnerChatReport,
  getPendingPartnerChatReportCount,
  listAdminPartnerChatReports,
  PartnerChatReportError,
  reviewPartnerChatReport,
} from "../services/partner-chat-report.service.js";

import {
  emitAdminChatReportsChanged,
} from "../socket/partner-chat.socket.js";

const router = Router();
const idSchema = z.string().uuid();
const statusSchema = z.enum(["pending", "resolved", "dismissed"]);

const reviewSchema = z
  .object({
    status: z.enum(["resolved", "dismissed"]),
    resolutionNote: z.string().trim().max(1000).optional(),
    actionSummary: z.string().trim().max(1000).optional(),
  })
  .strict();

router.use(requireAdmin);

router.get("/attention-count", async (_req, res, next) => {
  try {
    res.json({
      success: true,
      count: await getPendingPartnerChatReportCount(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const status = statusSchema.safeParse(req.query.status ?? "pending");

    if (!status.success) {
      res.status(400).json({
        success: false,
        code: "INVALID_CHAT_REPORT_STATUS",
        message: { en: "Invalid Chat report status.", am: "የChat report ሁኔታ ትክክል አይደለም።" },
      });
      return;
    }

    res.json({
      success: true,
      reports: await listAdminPartnerChatReports(status.data),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:reportId", async (req, res, next) => {
  try {
    const id = idSchema.safeParse(req.params.reportId);

    if (!id.success) {
      res.status(400).json({ success: false, code: "INVALID_CHAT_REPORT_ID" });
      return;
    }

    const report = await getAdminPartnerChatReport(id.data);

    if (!report) {
      res.status(404).json({
        success: false,
        code: "CHAT_REPORT_NOT_FOUND",
        message: { en: "Chat report not found.", am: "የChat report አልተገኘም።" },
      });
      return;
    }

    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
});

router.patch("/:reportId", async (req, res, next) => {
  try {
    const id = idSchema.safeParse(req.params.reportId);
    const body = reviewSchema.safeParse(req.body);
    const adminId = req.auth?.id;

    if (!id.success || !body.success || !adminId) {
      res.status(400).json({
        success: false,
        code: "INVALID_CHAT_REPORT_REVIEW",
        message: { en: "Invalid Chat report review.", am: "የChat report ግምገማው ትክክል አይደለም።" },
      });
      return;
    }

    const report = await reviewPartnerChatReport({
      reportId: id.data,
      adminId,
      ...body.data,
    });

    emitAdminChatReportsChanged({
      reportId: id.data,
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true, report });
  } catch (error) {
    if (error instanceof PartnerChatReportError) {
      res.status(error.status).json({
        success: false,
        code: error.code,
        message: { en: error.message, am: error.message },
      });
      return;
    }
    next(error);
  }
});

export default router;
