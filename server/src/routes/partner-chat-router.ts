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
  z,
} from "zod";

import {
  createPartnerChatSocketToken,
  loadChatIdentity,
} from "../services/partner-chat-auth.service.js";

import {
  decodeChatCursor,
  getPartnerChatMessages,
  getPartnerChatRoom,
  getPartnerChatUnreadCount,
  markPartnerChatRead,
  synchronizePartnerChatMessages,
  toChatParticipant,
  type ChatIdentity,
  type ChatRole,
} from "../services/partner-chat.service.js";

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

  return loadChatIdentity({
    id:
      req.auth.id,

    role,

    sessionVersion:
      role ===
        "representative"
        ? req.auth
            .sessionVersion
        : undefined,
  });
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

  router.use(
    ...auth,
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

        const room =
          await getPartnerChatRoom();

        res.json({
          success:
            true,

          socketToken:
            createPartnerChatSocketToken({
              identity,

              sessionVersion:
                role ===
                  "representative"
                  ? req.auth
                      ?.sessionVersion
                  : undefined,
            }),

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

        const result =
          await getPartnerChatMessages({
            before,
            limit:
              parsed.data.limit,
          });

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

  return router;
}
