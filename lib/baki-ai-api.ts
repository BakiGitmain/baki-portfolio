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
     EMPTY RESPONSE
     ======================================================= */

  if (
    !fullText.trim()
  ) {
    throw new Error(
      language ===
        "am"
        ? "Baki AI ባዶ መልስ መለሰ። እባክዎ እንደገና ይሞክሩ።"
        : "Baki AI returned an empty response. Please try again.",
    );
  }

  return {
    message:
      fullText.trim(),

    actions,
  };
}