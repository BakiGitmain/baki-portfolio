import {
  Router,
  type Request,
  type RequestHandler,
  type Response,
} from "express";

import {
  rateLimit,
} from "../middleware/rate-limit.middleware.js";

import {
  env,
} from "../config/env.js";

import {
  z,
} from "zod";

import {
  createPartnerChatSocketToken,
} from "../services/partner-chat-auth.service.js";

import {
  decodeChatCursor,
  createChatPublicKey,
  getPartnerChatMessages,
  getPartnerChatRoom,
  getPartnerChatUnreadCount,
  markPartnerChatRead,
  synchronizePartnerChatMessages,
  toChatParticipant,
  type ChatIdentity,
  type ChatRole,
} from "../services/partner-chat.service.js";

import {
  createPartnerChatReport,
  PartnerChatReportError,
} from "../services/partner-chat-report.service.js";

import {
  emitAdminChatReportsChanged,
} from "../socket/partner-chat.socket.js";

const chatPerformanceDiagnosticsEnabled =
  env.NODE_ENV !==
    "production" ||
  env.CHAT_PERF_DIAGNOSTICS ===
    "true";

function finishChatPerformance(
  res:
    Response,
  operation:
    string,
  stages:
    Record<string, number>,
) {
  const total =
    performance.now() -
    Number(
      res.locals
        .partnerChatStartedAt ??
        performance.now(),
    );

  const allStages = {
    ...stages,
    total,
  };

  res.setHeader(
    "Server-Timing",
    Object.entries(
      allStages,
    )
      .map(
        ([
          name,
          duration,
        ]) =>
          `${name};dur=${Math.max(0, duration).toFixed(1)}`,
      )
      .join(", "),
  );

  if (
    chatPerformanceDiagnosticsEnabled
  ) {
    console.info(
      `[chat-perf] ${operation}`,
      Object.fromEntries(
        Object.entries(
          allStages,
        ).map(
          ([
            name,
            duration,
          ]) => [
            `${name}Ms`,
            Number(
              duration.toFixed(
                1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

const historyQuerySchema =
  z.object({
    before:
      z.string().max(500).optional(),

    limit:
      z.coerce
        .number()
        .int()
        .min(20)
        .max(50)
        .default(40),
  });

const syncQuerySchema =
  z.object({
    since:
      z.string().datetime({
        offset:
          true,
      }),
  });

const chatReportSchema =
  z
    .object({
      messageId: z.string().uuid(),
      reason: z.enum([
        "spam",
        "harassment",
        "scam",
        "inappropriate",
        "threats",
        "other",
      ]),
      note: z.string().trim().max(1000).optional(),
    })
    .strict();

function errorMessage(
  en:
    string,

  am:
    string,
) {
  return {
    en,
    am,
  };
}

async function getRequestIdentity(
  req:
    Request,

  role:
    ChatRole,
) {
  if (
    !req.auth ||
    req.auth.role !==
      role
  ) {
    return null;
  }

  return {
    id:
      req.auth.id,

    role:
      role,

    name:
      req.auth.name,

    reference:
      role ===
        "representative"
        ? req.auth.username
        : null,

    publicKey:
      createChatPublicKey(
        role,
        req.auth.id,
      ),

    avatarUrl:
      null,

    sessionVersion:
      role ===
        "representative"
        ? req.auth
            .sessionVersion ??
          null
        : null,

    performance:
      null,
  };
}

async function withIdentity(
  req:
    Request,

  res:
    Response,

  role:
    ChatRole,
) {
  const identity =
    await getRequestIdentity(
      req,
      role,
    );

  if (
    !identity
  ) {
    res.status(403).json({
      success:
        false,

      message:
        errorMessage(
          "This account cannot access Partner Chat.",
          "ይህ account Partner Chatን መጠቀም አይችልም።",
        ),
    });

    return null;
  }

  return identity;
}

export function createPartnerChatRouter({
  role,
  auth,
}: {
  role:
    ChatRole;

  auth:
    RequestHandler[];
}) {
  const router =
    Router();

  const readLimiter =
    rateLimit({
      windowMs:
        15 *
        60 *
        1000,

      limit:
        360,

      standardHeaders:
        true,

      legacyHeaders:
        false,

      message: {
        success:
          false,

        message:
          errorMessage(
            "Too many chat requests. Please try again shortly.",
            "ብዙ የChat ጥያቄዎች ተልከዋል። እባክዎ ትንሽ ቆይተው ይሞክሩ።",
          ),
      },
    });

  const writeLimiter =
    rateLimit({
      windowMs:
        15 *
        60 *
        1000,

      limit:
        180,

      standardHeaders:
        true,

      legacyHeaders:
        false,

      message: {
        success:
          false,

        message:
          errorMessage(
            "Too many chat updates. Please try again shortly.",
            "ብዙ የChat ማሻሻያዎች ተልከዋል። እባክዎ ትንሽ ቆይተው ይሞክሩ።",
          ),
      },
    });

  const reportLimiter =
    rateLimit({
      windowMs: 24 * 60 * 60 * 1000,
      limit: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        code: "CHAT_REPORT_RATE_LIMITED",
        message: errorMessage(
          "You have submitted too many Chat reports today. Please try again later.",
          "ዛሬ በጣም ብዙ የChat ሪፖርቶችን ልከዋል። እባክዎ ቆይተው ይሞክሩ።",
        ),
      },
    });

  router.use(
    (
      _req,
      res,
      next,
    ) => {
      res.locals
        .partnerChatStartedAt =
        performance.now();

      next();
    },

    ...auth,

    (
      _req,
      res,
      next,
    ) => {
      res.locals
        .partnerChatAuthMs =
        performance.now() -
        Number(
          res.locals
            .partnerChatStartedAt,
        );

      next();
    },
  );

  router.get(
    "/session",
    readLimiter,
    async (
      req,
      res,
      next,
    ) => {
      try {
        const identityStartedAt =
          performance.now();
        const identity =
          await withIdentity(
            req,
            res,
            role,
          );

        if (
          !identity
        ) {
          return;
        }

        const identityMs =
          performance.now() -
          identityStartedAt;

        const room =
          getPartnerChatRoom();

        const tokenStartedAt =
          performance.now();
        const socketToken =
          createPartnerChatSocketToken({
            identity,

            sessionVersion:
              role ===
                "representative"
                ? req.auth
                    ?.sessionVersion
                : undefined,
          });
        const tokenMs =
          performance.now() -
          tokenStartedAt;

        finishChatPerformance(
          res,
          `${role} session`,
          {
            auth:
              Number(
                res.locals
                  .partnerChatAuthMs ??
                  0,
              ),
            identity:
              identityMs,
            token:
              tokenMs,
          },
        );

        res.json({
          success:
            true,

          socketToken:
            socketToken,

          self:
            toChatParticipant(
              identity,
            ),

          room,
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
    "/messages",
    readLimiter,
    async (
      req,
      res,
      next,
    ) => {
      try {
        const identityStartedAt =
          performance.now();
        const identity =
          await withIdentity(
            req,
            res,
            role,
          );

        if (
          !identity
        ) {
          return;
        }

        const identityMs =
          performance.now() -
          identityStartedAt;

        const parsed =
          historyQuerySchema.safeParse(
            req.query,
          );

        const before =
          parsed.success
            ? decodeChatCursor(
                parsed.data.before,
              )
            : null;

        if (
          !parsed.success ||
          (
            parsed.data.before &&
            !before
          )
        ) {
          res.status(400).json({
            success:
              false,

            message:
              errorMessage(
                "Invalid chat history request.",
                "የChat ታሪክ ጥያቄው ትክክል አይደለም።",
              ),
          });

          return;
        }

        const historyStartedAt =
          performance.now();
        const result =
          await getPartnerChatMessages({
            before,
            limit:
              parsed.data.limit,
          });
        const historyMs =
          performance.now() -
          historyStartedAt;

        finishChatPerformance(
          res,
          `${role} history`,
          {
            auth:
              Number(
                res.locals
                  .partnerChatAuthMs ??
                  0,
              ),
            identity:
              identityMs,
            history:
              historyMs,
          },
        );

        res.json({
          success:
            true,

          ...result,
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
    "/sync",
    readLimiter,
    async (
      req,
      res,
      next,
    ) => {
      try {
        const identity =
          await withIdentity(
            req,
            res,
            role,
          );

        if (
          !identity
        ) {
          return;
        }

        const parsed =
          syncQuerySchema.safeParse(
            req.query,
          );

        if (
          !parsed.success
        ) {
          res.status(400).json({
            success:
              false,

            message:
              errorMessage(
                "Invalid chat synchronization request.",
                "የChat ማመሳሰል ጥያቄው ትክክል አይደለም።",
              ),
          });

          return;
        }

        const result =
          await synchronizePartnerChatMessages(
            parsed.data.since,
          );

        res.json({
          success:
            true,

          ...result,
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
    readLimiter,
    async (
      req,
      res,
      next,
    ) => {
      try {
        const identity =
          await withIdentity(
            req,
            res,
            role,
          );

        if (
          !identity
        ) {
          return;
        }

        res.json({
          success:
            true,

          unreadCount:
            await getPartnerChatUnreadCount(
              identity,
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

  router.post(
    "/read",
    writeLimiter,
    async (
      req,
      res,
      next,
    ) => {
      try {
        const identity:
          ChatIdentity |
          null =
          await withIdentity(
            req,
            res,
            role,
          );

        if (
          !identity
        ) {
          return;
        }

        const result =
          await markPartnerChatRead(
            identity,
          );

        res.json({
          success:
            true,

          ...result,
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

  if (role === "representative") {
    router.post(
      "/reports",
      reportLimiter,
      async (req, res, next) => {
        try {
          const identity = await withIdentity(req, res, role);

          if (!identity) {
            return;
          }

          const parsed = chatReportSchema.safeParse(req.body);

          if (!parsed.success) {
            res.status(400).json({
              success: false,
              code: "INVALID_CHAT_REPORT",
              message: errorMessage(
                "Choose a valid report reason and keep the note under 1,000 characters.",
                "ትክክለኛ የሪፖርት ምክንያት ይምረጡ እና ማስታወሻውን ከ1,000 ፊደላት በታች ያድርጉ።",
              ),
            });
            return;
          }

          const report = await createPartnerChatReport({
            reporterRepresentativeId: identity.id,
            ...parsed.data,
          });

          emitAdminChatReportsChanged({
            reportId: report.id,
            createdAt: new Date(report.createdAt).toISOString(),
          });

          res.status(201).json({
            success: true,
            report,
            message: errorMessage(
              "Thank you. The message was sent to the Baki Digital admin team for review.",
              "እናመሰግናለን። መልዕክቱ ለBaki Digital አስተዳዳሪዎች ለግምገማ ተልኳል።",
            ),
          });
        } catch (error) {
          if (error instanceof PartnerChatReportError) {
            res.status(error.status).json({
              success: false,
              code: error.code,
              message: errorMessage(
                error.message,
                error.code === "CANNOT_REPORT_OWN_MESSAGE"
                  ? "የራስዎን መልዕክት ሪፖርት ማድረግ አይችሉም።"
                  : error.code === "CHAT_REPORT_ALREADY_EXISTS"
                    ? "ይህን መልዕክት ከዚህ በፊት ሪፖርት አድርገዋል።"
                    : "ይህ መልዕክት ከእንግዲህ ሪፖርት ሊደረግ አይችልም።",
              ),
            });
            return;
          }

          next(error);
        }
      },
    );
  }

  return router;
}
