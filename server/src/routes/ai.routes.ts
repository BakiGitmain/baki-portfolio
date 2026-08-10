import {
  Router,
  type Request,
  type Response,
} from "express";

import {
  openai,
} from "../ai/openai-client.js";

import {
  BAKI_AI_INSTRUCTIONS,
  getBakiAiRelevantContext,
} from "../ai/baki-ai-config.js";

import {
  env,
} from "../config/env.js";

/* =========================================================
   ROUTER
   ========================================================= */

const router =
  Router();

/* =========================================================
   REQUEST LIMITS
   ========================================================= */

const MAX_MESSAGE_LENGTH =
  1200;

/*
  Keep enough recent conversation for natural follow-ups
  without repeatedly sending a massive chat history.
*/

const MAX_HISTORY_MESSAGES =
  6;

const MAX_HISTORY_MESSAGE_LENGTH =
  900;

/* =========================================================
   LOCAL VISITOR RATE LIMIT
   ========================================================= */

const RATE_LIMIT_MAX =
  20;

const RATE_LIMIT_WINDOW_MS =
  15 *
  60 *
  1000;

type RateLimitEntry = {
  count:
    number;

  resetAt:
    number;
};

const rateLimitStore =
  new Map<
    string,
    RateLimitEntry
  >();

/* =========================================================
   HISTORY TYPES
   ========================================================= */

type IncomingHistoryMessage = {
  role?:
    unknown;

  content?:
    unknown;
};

type SafeHistoryMessage = {
  role:
    | "user"
    | "assistant";

  content:
    string;
};

/* =========================================================
   CLIENT IDENTIFIER
   ========================================================= */

function getClientKey(
  req:
    Request,
) {
  return (
    req.ip ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

/* =========================================================
   LOCAL RATE LIMIT
   ========================================================= */

function isLocallyRateLimited(
  req:
    Request,
) {
  const now =
    Date.now();

  const key =
    getClientKey(
      req,
    );

  const existing =
    rateLimitStore.get(
      key,
    );

  /* =======================================================
     FIRST REQUEST / EXPIRED WINDOW
     ======================================================= */

  if (
    !existing ||
    existing.resetAt <=
      now
  ) {
    rateLimitStore.set(
      key,
      {
        count:
          1,

        resetAt:
          now +
          RATE_LIMIT_WINDOW_MS,
      },
    );

    return false;
  }

  /* =======================================================
     LIMIT HIT
     ======================================================= */

  if (
    existing.count >=
    RATE_LIMIT_MAX
  ) {
    return true;
  }

  /* =======================================================
     INCREMENT
     ======================================================= */

  existing.count +=
    1;

  rateLimitStore.set(
    key,
    existing,
  );

  return false;
}

/* =========================================================
   CLEAN OLD RATE LIMIT ENTRIES
   ========================================================= */

function cleanupRateLimits() {
  if (
    rateLimitStore.size <
    100
  ) {
    return;
  }

  const now =
    Date.now();

  for (
    const [
      key,
      value,
    ] of rateLimitStore
  ) {
    if (
      value.resetAt <=
      now
    ) {
      rateLimitStore.delete(
        key,
      );
    }
  }
}

/* =========================================================
   SANITIZE CHAT HISTORY
   ========================================================= */

function sanitizeHistory(
  value:
    unknown,
): SafeHistoryMessage[] {
  if (
    !Array.isArray(
      value,
    )
  ) {
    return [];
  }

  return value
    .slice(
      -MAX_HISTORY_MESSAGES,
    )
    .flatMap(
      (
        raw,
      ) => {
        const item =
          raw as IncomingHistoryMessage;

        if (
          item.role !==
            "user" &&
          item.role !==
            "assistant"
        ) {
          return [];
        }

        if (
          typeof item.content !==
          "string"
        ) {
          return [];
        }

        const content =
          item.content
            .trim()
            .slice(
              0,
              MAX_HISTORY_MESSAGE_LENGTH,
            );

        if (
          !content
        ) {
          return [];
        }

        return [
          {
            role:
              item.role,

            content,
          },
        ];
      },
    );
}

/* =========================================================
   PROVIDER ERROR STATUS
   ========================================================= */

function getApiErrorStatus(
  error:
    unknown,
) {
  if (
    typeof error !==
      "object" ||
    error ===
      null
  ) {
    return null;
  }

  if (
    !(
      "status" in
      error
    )
  ) {
    return null;
  }

  const status =
    (
      error as {
        status?:
          unknown;
      }
    ).status;

  return typeof status ===
    "number"
    ? status
    : null;
}

/* =========================================================
   CHAT ROUTE
   ========================================================= */

router.post(
  "/chat",

  async (
    req:
      Request,

    res:
      Response,
  ) => {
    cleanupRateLimits();

    /* =====================================================
       OUR OWN VISITOR RATE LIMIT
       ===================================================== */

    if (
      isLocallyRateLimited(
        req,
      )
    ) {
      return res
        .status(
          429,
        )
        .json({
          success:
            false,

          message: {
            en:
              "You're sending messages a little too quickly. Give it a moment and try again.",

            am:
              "መልዕክቶችን በጣም በፍጥነት እየላኩ ነው። ትንሽ ቆይተው እንደገና ይሞክሩ።",
          },
        });
    }

    /* =====================================================
       MESSAGE VALIDATION
       ===================================================== */

    const rawMessage =
      req.body
        ?.message;

    if (
      typeof rawMessage !==
      "string"
    ) {
      return res
        .status(
          400,
        )
        .json({
          success:
            false,

          message: {
            en:
              "Please enter a valid message.",

            am:
              "እባክዎ ትክክለኛ መልዕክት ያስገቡ።",
          },
        });
    }

    const message =
      rawMessage
        .trim()
        .slice(
          0,
          MAX_MESSAGE_LENGTH,
        );

    if (
      !message
    ) {
      return res
        .status(
          400,
        )
        .json({
          success:
            false,

          message: {
            en:
              "Please enter a message.",

            am:
              "እባክዎ መልዕክት ያስገቡ።",
          },
        });
    }

    /* =====================================================
       CHAT HISTORY
       ===================================================== */

    const history =
      sanitizeHistory(
        req.body
          ?.history,
      );

    /* =====================================================
       RELEVANT PUBLIC KNOWLEDGE

       Keep using your context router.

       This prevents sending every Baki fact on every
       request and saves tokens.
       ===================================================== */

    const relevantContext =
      getBakiAiRelevantContext(
        message,
        history,
      );

    /* =====================================================
       CONVERSATION
       ===================================================== */

    const conversation = [
      {
        role:
          "system" as const,

        content:
          `${BAKI_AI_INSTRUCTIONS}

RELEVANT PUBLIC INFORMATION FOR THIS CONVERSATION:

${relevantContext}`,
      },

      ...history,

      {
        role:
          "user" as const,

        content:
          message,
      },
    ];

    try {
      /* ===================================================
         MISTRAL STREAMING REQUEST

         Groq/Qwen-specific options such as:

         reasoning_effort: "none"

         are deliberately removed.
         =================================================== */

      const stream =
        await openai
          .chat
          .completions
          .create({
            model:
              env.MISTRAL_MODEL,

            messages:
              conversation,

            /*
              Natural enough for Baki AI without making
              responses unnecessarily random.
            */

            temperature:
              0.5,

            /*
              Baki AI is supposed to stay concise.

              280 is enough for normal:
              - pricing answers
              - project questions
              - job information
              - service explanations
              - navigation responses
            */

            max_tokens:
              280,

            stream:
              true,
          });

      /* ===================================================
         STREAMING HEADERS
         =================================================== */

      res.status(
        200,
      );

      res.setHeader(
        "Content-Type",
        "text/plain; charset=utf-8",
      );

      res.setHeader(
        "Cache-Control",
        "no-cache, no-transform",
      );

      res.setHeader(
        "Connection",
        "keep-alive",
      );

      res.setHeader(
        "X-Accel-Buffering",
        "no",
      );

      /*
        Send headers immediately so the browser can start
        receiving the stream without unnecessary buffering.
      */

      res.flushHeaders();

      /* ===================================================
         STREAM RESPONSE
         =================================================== */

      let fullText =
        "";

      for await (
        const chunk of
          stream
      ) {
        /*
          Stop if the visitor disconnected.
        */

        if (
          res.writableEnded ||
          res.destroyed
        ) {
          break;
        }

        const content =
          chunk
            .choices[0]
            ?.delta
            ?.content;

        /*
          Normal chat chunks should contain strings.

          Ignore anything else.
        */

        if (
          typeof content !==
            "string" ||
          content.length ===
            0
        ) {
          continue;
        }

        fullText +=
          content;

        /*
          Send each chunk immediately.

          Do NOT wait for the full answer.
        */

        res.write(
          content,
        );
      }

      /* ===================================================
         EMPTY RESPONSE FALLBACK
         =================================================== */

      if (
        !fullText.trim() &&
        !res.writableEnded &&
        !res.destroyed
      ) {
        res.write(
          "Baki AI couldn't generate a response. Please try again.",
        );
      }

      /* ===================================================
         FINISH STREAM
         =================================================== */

      if (
        !res.writableEnded &&
        !res.destroyed
      ) {
        res.end();
      }

      return;
    } catch (
      error
    ) {
      const status =
        getApiErrorStatus(
          error,
        );

      /* ===================================================
         SERVER-ONLY LOG

         Useful for debugging.

         Never expose provider details or secret information
         to the visitor.
         =================================================== */

      console.error(
        "Baki AI Mistral error:",
        {
          status,

          message:
            error instanceof
              Error
              ? error.message
              : "Unknown Mistral error",
        },
      );

      /* ===================================================
         STREAM ALREADY STARTED

         Once headers are sent we can't switch back to a
         JSON error response.
         =================================================== */

      if (
        res.headersSent
      ) {
        if (
          !res.writableEnded &&
          !res.destroyed
        ) {
          res.end();
        }

        return;
      }

      /* ===================================================
         MISTRAL RATE LIMIT
         =================================================== */

      if (
        status ===
        429
      ) {
        return res
          .status(
            429,
          )
          .json({
            success:
              false,

            message: {
              en:
                "Baki AI is busy right now. Give it a moment and try again.",

              am:
                "Baki AI አሁን በስራ ላይ ነው። ትንሽ ቆይተው እንደገና ይሞክሩ።",
            },
          });
      }

      /* ===================================================
         INVALID / MISSING MISTRAL KEY
         =================================================== */

      if (
        status ===
          401 ||
        status ===
          403
      ) {
        console.error(
          "Mistral authentication failed. Check MISTRAL_API_KEY.",
        );
      }

      /* ===================================================
         GENERIC ERROR
         =================================================== */

      return res
        .status(
          500,
        )
        .json({
          success:
            false,

          message: {
            en:
              "Baki AI couldn't respond right now. Please try again.",

            am:
              "Baki AI ለጊዜው መልስ መስጠት አልቻለም። እባክዎ እንደገና ይሞክሩ።",
          },
        });
    }
  },
);

export default router;