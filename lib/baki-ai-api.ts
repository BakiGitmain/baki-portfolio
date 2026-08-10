/* =========================================================
   BAKI AI HISTORY
   ========================================================= */

export type BakiAiHistoryMessage = {
  role:
    | "user"
    | "assistant";

  content:
    string;
};

/* =========================================================
   APPROVED PUBLIC ACTIONS

   IMPORTANT:
   These are IDs.

   They are NOT URLs coming from the AI.

   The actual URL / scroll destination is controlled by
   our frontend.
   ========================================================= */

export const BAKI_AI_ACTION_IDS = [
  "home",
  "about",
  "projects",
  "all-projects",
  "skills",
  "experience",
  "contact",
  "job-info",
  "job-apply",
] as const;

export type BakiAiActionId =
  (typeof BAKI_AI_ACTION_IDS)[number];

/* =========================================================
   TYPES
   ========================================================= */

type Language =
  | "en"
  | "am";

type LocalizedMessage = {
  en?: string;
  am?: string;
};

type BakiAiErrorResponse = {
  success?:
    false;

  message?:
    | string
    | LocalizedMessage;
};

/* =========================================================
   NAVIGATION MARKER

   Groq may generate:

   [[BAKI_NAV:projects]]

   We intercept it here.

   It never becomes part of the displayed AI message.
   ========================================================= */

const NAV_PREFIX =
  "[[BAKI_NAV:";

const NAV_SUFFIX =
  "]]";

/* =========================================================
   API URL
   ========================================================= */

function getApiUrl() {
  const apiUrl =
    process.env
      .NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured.",
    );
  }

  return apiUrl.replace(
    /\/$/,
    "",
  );
}

/* =========================================================
   ACTION VALIDATION
   ========================================================= */

function isBakiAiActionId(
  value:
    string,
): value is BakiAiActionId {
  return (
    BAKI_AI_ACTION_IDS as readonly string[]
  ).includes(
    value,
  );
}

/* =========================================================
   ERROR MESSAGE
   ========================================================= */

function getErrorMessage(
  data:
    BakiAiErrorResponse | null,

  language:
    Language,
) {
  const message =
    data?.message;

  if (
    typeof message ===
    "string"
  ) {
    return message;
  }

  if (
    message &&
    typeof message ===
      "object"
  ) {
    const localized =
      message[
        language
      ];

    if (
      localized
    ) {
      return localized;
    }

    if (
      message.en
    ) {
      return message.en;
    }
  }

  return language ===
    "am"
    ? "Baki AI ለጊዜው መልስ መስጠት አልቻለም። እባክዎ እንደገና ይሞክሩ።"
    : "Baki AI couldn't respond right now. Please try again.";
}

/* =========================================================
   SEND / STREAM MESSAGE
   ========================================================= */

export async function sendBakiAiMessage({
  message,
  history,
  language,
  onDelta,
  onActions,
  signal,
}: {
  message:
    string;

  history:
    BakiAiHistoryMessage[];

  language:
    Language;

  onDelta?: (
    delta:
      string,

    fullText:
      string,
  ) => void;

  onActions?: (
    actions:
      BakiAiActionId[],
  ) => void;

  signal?:
    AbortSignal;
}) {
  const response =
    await fetch(
      `${getApiUrl()}/api/ai/chat`,
      {
        method:
          "POST",

        cache:
          "no-store",

        signal,

        headers: {
          Accept:
            "text/plain, application/json",

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            message,

            history:
              history.slice(
                -10,
              ),
          }),
      },
    );

  /* =======================================================
     ERROR RESPONSE
     ======================================================= */

  if (
    !response.ok
  ) {
    let data:
      BakiAiErrorResponse | null =
        null;

    try {
      data =
        (await response.json()) as
          BakiAiErrorResponse;
    } catch {
      data =
        null;
    }

    throw new Error(
      getErrorMessage(
        data,
        language,
      ),
    );
  }

  /* =======================================================
     STREAM BODY
     ======================================================= */

  if (
    !response.body
  ) {
    throw new Error(
      language ===
        "am"
        ? "Baki AI መልስ መላክ አልቻለም።"
        : "Baki AI couldn't start the response stream.",
    );
  }

  const reader =
    response.body
      .getReader();

  const decoder =
    new TextDecoder(
      "utf-8",
    );

  /*
    Raw stream buffer.

    We keep a few characters behind while streaming so a
    navigation marker split across network chunks never
    flashes on screen.
  */

  let streamBuffer =
    "";

  /*
    Only text the visitor is actually allowed to see.
  */

  let fullText =
    "";

  /*
    AI can request at most 2 public actions.
  */

  const actions:
    BakiAiActionId[] =
      [];

  /* =======================================================
     EMIT VISIBLE TEXT
     ======================================================= */

  function emitVisibleText(
    text:
      string,
  ) {
    if (
      !text
    ) {
      return;
    }

    fullText +=
      text;

    onDelta?.(
      text,
      fullText,
    );
  }

  /* =======================================================
     ADD SAFE ACTION
     ======================================================= */

  function addAction(
    rawAction:
      string,
  ) {
    const action =
      rawAction.trim();

    /*
      This is the security boundary.

      Even if the model tries:

      [[BAKI_NAV:https://something.com]]

      or:

      [[BAKI_NAV:admin]]

      nothing happens.
    */

    if (
      !isBakiAiActionId(
        action,
      )
    ) {
      return;
    }

    if (
      actions.includes(
        action,
      )
    ) {
      return;
    }

    if (
      actions.length >=
      2
    ) {
      return;
    }

    actions.push(
      action,
    );

    onActions?.([
      ...actions,
    ]);
  }

  /* =======================================================
     PROCESS RAW MODEL STREAM
     ======================================================= */

  function processStreamBuffer(
    final:
      boolean,
  ) {
    while (
      true
    ) {
      const markerStart =
        streamBuffer.indexOf(
          NAV_PREFIX,
        );

      /* ===================================================
         MARKER FOUND
         =================================================== */

      if (
        markerStart !==
        -1
      ) {
        /*
          Everything before the marker is normal visible
          assistant text.
        */

        const visibleBeforeMarker =
          streamBuffer.slice(
            0,
            markerStart,
          );

        emitVisibleText(
          visibleBeforeMarker,
        );

        /*
          Remove visible text.

          Buffer now starts exactly at [[BAKI_NAV:
        */

        streamBuffer =
          streamBuffer.slice(
            markerStart,
          );

        const markerEnd =
          streamBuffer.indexOf(
            NAV_SUFFIX,
            NAV_PREFIX.length,
          );

        /*
          Marker started but has not completely arrived yet.

          Keep it buffered until the next network chunk.
        */

        if (
          markerEnd ===
          -1
        ) {
          /*
            If the stream has completely ended and the model
            somehow generated a malformed marker, discard it.

            Never show internal action syntax to visitors.
          */

          if (
            final
          ) {
            streamBuffer =
              "";
          }

          return;
        }

        const rawAction =
          streamBuffer.slice(
            NAV_PREFIX.length,
            markerEnd,
          );

        addAction(
          rawAction,
        );

        /*
          Remove the complete hidden marker.
        */

        streamBuffer =
          streamBuffer.slice(
            markerEnd +
              NAV_SUFFIX.length,
          );

        /*
          There could theoretically be another marker after
          it, so continue the loop.
        */

        continue;
      }

      /* ===================================================
         NO MARKER
         =================================================== */

      if (
        final
      ) {
        emitVisibleText(
          streamBuffer,
        );

        streamBuffer =
          "";

        return;
      }

      /*
        Hold enough trailing characters to detect:

        [[BAKI_NAV:

        even if it is split across two HTTP chunks.
      */

      const keepLength =
        NAV_PREFIX.length -
        1;

      if (
        streamBuffer.length <=
        keepLength
      ) {
        return;
      }

      const safeLength =
        streamBuffer.length -
        keepLength;

      const safeText =
        streamBuffer.slice(
          0,
          safeLength,
        );

      streamBuffer =
        streamBuffer.slice(
          safeLength,
        );

      emitVisibleText(
        safeText,
      );

      return;
    }
  }

  /* =======================================================
     READ NETWORK STREAM
     ======================================================= */

  while (
    true
  ) {
    const {
      done,
      value,
    } =
      await reader.read();

    if (
      done
    ) {
      break;
    }

    const chunk =
      decoder.decode(
        value,
        {
          stream:
            true,
        },
      );

    if (
      !chunk
    ) {
      continue;
    }

    streamBuffer +=
      chunk;

    processStreamBuffer(
      false,
    );
  }

  /* =======================================================
     FLUSH DECODER
     ======================================================= */

  const finalDecoderChunk =
    decoder.decode();

  if (
    finalDecoderChunk
  ) {
    streamBuffer +=
      finalDecoderChunk;
  }

  processStreamBuffer(
    true,
  );

/* =======================================================
   EMPTY / ACTION-ONLY RESPONSE SAFETY

   Sometimes the model may return only hidden navigation
   markers without visible text.

   That is NOT an error for the visitor.

   Instead:
   - preserve the safe navigation actions
   - generate a small natural fallback
   - never expose technical "empty response" wording
   ======================================================= */

if (
  !fullText.trim()
) {
  const normalizedMessage =
    message
      .trim()
      .toLowerCase();

  /* =====================================================
     PROJECT INTENT FALLBACK

     If the model somehow returned absolutely nothing,
     we can still safely understand common requests such as:

     "show me his project"
     "I wanna see websites he made"
     "show his work"

     Navigation remains hard-coded and safe.
     ===================================================== */

  const looksLikeProjectRequest =
    (
      /\b(project|projects|portfolio|work|website|websites)\b/
        .test(
          normalizedMessage,
        )
    ) &&
    (
      /\b(show|see|view|made|built|project|projects|portfolio|work)\b/
        .test(
          normalizedMessage,
        )
    );

  if (
    actions.length ===
      0 &&
    looksLikeProjectRequest
  ) {
    addAction(
      "projects",
    );

    addAction(
      "all-projects",
    );
  }

  /* =====================================================
     ACTION-AWARE FALLBACK TEXT

     This means even an action-only model response becomes
     a normal Baki AI message instead of a red error.
     ===================================================== */

  let fallbackMessage:
    string;

  if (
    actions.includes(
      "projects",
    ) &&
    actions.includes(
      "all-projects",
    )
  ) {
    fallbackMessage =
      language ===
      "am"
        ? "አዎ 👀 የBakiን featured projects ወይም ሁሉንም public projects ከታች ማየት ይችላሉ።"
        : "Yep 👀 You can check out Baki's featured projects or browse all of his public projects below.";
  } else if (
    actions.includes(
      "projects",
    )
  ) {
    fallbackMessage =
      language ===
      "am"
        ? "አዎ 👀 የBakiን featured projects ከታች ማየት ይችላሉ።"
        : "Yep 👀 You can check out Baki's featured projects below.";
  } else if (
    actions.includes(
      "all-projects",
    )
  ) {
    fallbackMessage =
      language ===
      "am"
        ? "የBakiን public projects በሙሉ ከታች ማየት ይችላሉ 👀"
        : "You can browse all of Baki's public projects below 👀.";
  } else if (
    actions.includes(
      "skills",
    )
  ) {
    fallbackMessage =
      language ===
      "am"
        ? "የBakiን skills ከታች ማየት ይችላሉ 💻"
        : "You can check out Baki's skills below 💻.";
  } else if (
    actions.includes(
      "experience",
    )
  ) {
    fallbackMessage =
      language ===
      "am"
        ? "የBakiን experience ከታች ማየት ይችላሉ."
        : "You can check out Baki's experience below.";
  } else if (
    actions.includes(
      "about",
    )
  ) {
    fallbackMessage =
      language ===
      "am"
        ? "ስለ Baki ተጨማሪ መረጃ ከታች ማየት ይችላሉ."
        : "You can learn more about Baki below.";
  } else if (
    actions.includes(
      "contact",
    )
  ) {
    fallbackMessage =
      language ===
      "am"
        ? "Bakiን ለማግኘት Contact sectionን ከታች መጠቀም ይችላሉ."
        : "You can use the Contact section below to get in touch with Baki.";
  } else if (
    actions.includes(
      "job-info",
    )
  ) {
    fallbackMessage =
      language ===
      "am"
        ? "ስለ sales representative opportunity ሙሉ መረጃውን ከታች ማየት ይችላሉ."
        : "You can check out the full sales representative information below.";
  } else if (
    actions.includes(
      "job-apply",
    )
  ) {
    fallbackMessage =
      language ===
      "am"
        ? "Application systemው አሁንም development ላይ ነው 🚧፣ ግን prototype pageውን ከታች ማየት ይችላሉ።"
        : "The application system is still under development 🚧, but you can preview the application page below.";
  } else if (
    actions.includes(
      "home",
    )
  ) {
    fallbackMessage =
      language ===
      "am"
        ? "ወደ Home ከታች መሄድ ይችላሉ."
        : "You can head back to the homepage below.";
  } else {
    /*
      TRUE empty provider response.

      Still don't show ugly technical wording like:
      "returned an empty response".

      The visitor only sees a normal, friendly message.
    */

    fallbackMessage =
      language ===
      "am"
        ? "ትንሽ ችግኝ ተፈጠረ 😅። ጥያቄውን አንድ ጊዜ እንደገና ይላኩ።"
        : "I hit a small hiccup there 😅. Try that one again.";
  }

  /*
    IMPORTANT:

    Use emitVisibleText instead of directly changing
    fullText.

    This triggers the normal streaming callback so the
    assistant bubble is created correctly and any actions
    already received are attached to it.
  */

  emitVisibleText(
    fallbackMessage,
  );
}

/* =======================================================
   FINAL RESULT
   ======================================================= */

return {
  message:
    fullText.trim(),

  actions,
};

  return {
    message:
      fullText.trim(),

    actions,
  };
}