import {
  Router,
  type Response,
} from "express";

import {
  z,
} from "zod";

import {
  requireAdmin,
} from "../middleware/auth.middleware.js";

import {
  banPartner,
  getPartnerModerationProfile,
  PartnerModerationError,
  unbanPartner,
} from "../services/partner-moderation.service.js";

import {
  disconnectRepresentativeFromPartnerChat,
} from "../socket/partner-chat.socket.js";

const router = Router();

const idSchema = z.string().uuid();

const banSchema = z
  .object({
    duration: z.enum(["1h", "24h", "1w", "30d", "permanent", "custom"]),
    reason: z.string().trim().min(1).max(500),
    customUntil: z.string().datetime({ offset: true }).nullable().optional(),
    sourceChatReportId: z.string().uuid().nullable().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.duration === "custom" && !value.customUntil) {
      context.addIssue({
        code: "custom",
        path: ["customUntil"],
        message: "A custom expiry is required.",
      });
    }
  });

function sendError(
  res: Response,
  status: number,
  code: string,
  en: string,
  am: string,
) {
  res.status(status).json({
    success: false,
    code,
    message: { en, am },
  });
}

router.use(requireAdmin);

router.get("/:representativeId/moderation", async (req, res, next) => {
  try {
    const id = idSchema.safeParse(req.params.representativeId);

    if (!id.success) {
      sendError(res, 400, "INVALID_PARTNER_ID", "Invalid Partner id.", "የPartner id ትክክል አይደለም።");
      return;
    }

    res.json({
      success: true,
      moderation: await getPartnerModerationProfile(id.data),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:representativeId/ban", async (req, res, next) => {
  try {
    const id = idSchema.safeParse(req.params.representativeId);
    const body = banSchema.safeParse(req.body);
    const adminId = req.auth?.id;

    if (!id.success || !body.success || !adminId) {
      sendError(
        res,
        400,
        "INVALID_PARTNER_BAN",
        "Choose a duration and provide a clear ban reason.",
        "የእገዳ ጊዜ ይምረጡ እና ግልጽ ምክንያት ያስገቡ።",
      );
      return;
    }

    const active = await banPartner({
      representativeId: id.data,
      adminId,
      duration: body.data.duration,
      reason: body.data.reason,
      customUntil: body.data.customUntil ? new Date(body.data.customUntil) : null,
      sourceChatReportId: body.data.sourceChatReportId ?? null,
    });

    disconnectRepresentativeFromPartnerChat(id.data);

    res.status(201).json({
      success: true,
      active,
      message: {
        en: active.isPermanent
          ? "The Partner has been permanently banned."
          : "The Partner has been temporarily banned.",
        am: active.isPermanent
          ? "Partnerው በቋሚነት ታግዷል።"
          : "Partnerው ለጊዜው ታግዷል።",
      },
    });
  } catch (error) {
    if (error instanceof PartnerModerationError) {
      sendError(res, error.status, error.code, error.message, error.message);
      return;
    }
    next(error);
  }
});

router.post("/:representativeId/unban", async (req, res, next) => {
  try {
    const id = idSchema.safeParse(req.params.representativeId);
    const adminId = req.auth?.id;

    if (!id.success || !adminId) {
      sendError(res, 400, "INVALID_PARTNER_UNBAN", "Invalid Partner unban request.", "የPartner እገዳ ማንሻ ጥያቄው ትክክል አይደለም።");
      return;
    }

    await unbanPartner({ representativeId: id.data, adminId });

    res.json({
      success: true,
      message: {
        en: "Partner access has been restored.",
        am: "የPartner መዳረሻ ተመልሷል።",
      },
    });
  } catch (error) {
    if (error instanceof PartnerModerationError) {
      sendError(res, error.status, error.code, error.message, error.message);
      return;
    }
    next(error);
  }
});

export default router;
