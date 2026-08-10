"use client";

import Image from "next/image";

import {
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  AnimatePresence,
  motion,
} from "motion/react";

import {
  ArrowRight,
  Bot,
  RefreshCw,
  Send,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import {
  useLanguage,
} from "@/components/providers/language-provider";

import {
  sendBakiAiMessage,
  type BakiAiActionId,
  type BakiAiHistoryMessage,
} from "@/lib/baki-ai-api";

/* =========================================================
   AVATARS
   ========================================================= */

const AI_AVATAR_SRC:
  string | null =
    "/images/baki-ai-avatar.png";

const USER_AVATAR_SRC:
  string | null =
    "/images/chat-user-avatar.png";

/* =========================================================
   HOMEPAGE NAVIGATION
   ========================================================= */

const PENDING_SCROLL_KEY =
  "baki-portfolio-pending-scroll";

const SCROLL_OFFSET =
  88;

type SectionTarget =
  | "home"
  | "about"
  | "projects"
  | "skills"
  | "experience"
  | "contact";

/* =========================================================
   ACTION DEFINITIONS

   Groq only returns safe action IDs.

   It does NOT control URLs directly.
   ========================================================= */

type ActionDefinition =
  | {
      kind:
        "scroll";

      target:
        SectionTarget;

      label: {
        en:
          string;

        am:
          string;
      };
    }
  | {
      kind:
        "route";

      target:
        | "/projects"
        | "/hire-info"
        | "/hire";

      label: {
        en:
          string;

        am:
          string;
      };
    };

const ACTION_DEFINITIONS:
  Record<
    BakiAiActionId,
    ActionDefinition
  > = {
    home: {
      kind:
        "scroll",

      target:
        "home",

      label: {
        en:
          "Go to Home",

        am:
          "ወደ Home",
      },
    },

    about: {
      kind:
        "scroll",

      target:
        "about",

      label: {
        en:
          "About Baki",

        am:
          "ስለ Baki",
      },
    },

    projects: {
      kind:
        "scroll",

      target:
        "projects",

      label: {
        en:
          "View Projects",

        am:
          "ፕሮጀክቶችን ይመልከቱ",
      },
    },

    "all-projects": {
      kind:
        "route",

      target:
        "/projects",

      label: {
        en:
          "See All Projects",

        am:
          "ሁሉንም ፕሮጀክቶች",
      },
    },

    skills: {
      kind:
        "scroll",

      target:
        "skills",

      label: {
        en:
          "View Skills",

        am:
          "Skills ይመልከቱ",
      },
    },

    experience: {
      kind:
        "scroll",

      target:
        "experience",

      label: {
        en:
          "View Experience",

        am:
          "Experience ይመልከቱ",
      },
    },

    contact: {
      kind:
        "scroll",

      target:
        "contact",

      label: {
        en:
          "Contact Baki",

        am:
          "Bakiን ያግኙ",
      },
    },

    "job-info": {
      kind:
        "route",

      target:
        "/hire-info",

      label: {
        en:
          "More Job Info",

        am:
          "ተጨማሪ የስራ መረጃ",
      },
    },

    "job-apply": {
      kind:
        "route",

      target:
        "/hire",

      label: {
        en:
          "Application Page",

        am:
          "የማመልከቻ ገጽ",
      },
    },
  };

/* =========================================================
   MESSAGE TYPES
   ========================================================= */

type ChatMessage =
  BakiAiHistoryMessage & {
    id:
      string;

    isError?:
      boolean;

    actions?:
      BakiAiActionId[];
  };

/* =========================================================
   COPY
   ========================================================= */

const CHAT_COPY = {
  en: {
    name:
      "Baki AI",

    subtitle:
      "Portfolio assistant",

    ready:
      "Ready to help",

    greeting:
      "Hey 👋 I'm Baki AI. I'm here to help with Baki's projects, pricing, services, partnerships, opportunities, and how working together works. What would you like to know?",

    placeholder:
      "Ask Baki AI anything...",

    disclaimer:
      "Project prices are estimates. Final quotes are confirmed by Baki.",

    clear:
      "Start new chat",

    tooltip:
      "Ask Baki AI",

    close:
      "Close Baki AI",

    send:
      "Send message",

    suggestions: [
      {
        label:
          "Estimate a project",

        prompt:
          "I have a project idea. Can you help me estimate the price?",
      },

      {
        label:
          "What can you build?",

        prompt:
          "What kind of websites and web apps can Baki build?",
      },

      {
        label:
          "Job opportunity",

        prompt:
          "Tell me about the job opportunity.",
      },
    ],
  },

  am: {
    name:
      "Baki AI",

    subtitle:
      "የPortfolio AI ረዳት",

    ready:
      "ለመርዳት ዝግጁ",

    greeting:
      "ሰላም 👋 እኔ Baki AI ነኝ። ስለ Baki ፕሮጀክቶች፣ ዋጋ፣ አገልግሎቶች፣ partnership፣ የስራ ዕድል እና አብሮ መስራት ልረዳዎ እችላለሁ። ምን ማወቅ ይፈልጋሉ?",

    placeholder:
      "Baki AIን ይጠይቁ...",

    disclaimer:
      "የፕሮጀክት ዋጋዎች ግምት ናቸው። Final quote በBaki ይረጋገጣል።",

    clear:
      "አዲስ chat",

    tooltip:
      "Baki AIን ይጠይቁ",

    close:
      "Baki AIን ዝጋ",

    send:
      "መልዕክት ላክ",

    suggestions: [
      {
        label:
          "የፕሮጀክት ዋጋ",

        prompt:
          "የፕሮጀክት ሀሳብ አለኝ። የዋጋ ግምት ልትሰጠኝ ትችላለህ?",
      },

      {
        label:
          "ምን መስራት ትችላላችሁ?",

        prompt:
          "Baki ምን አይነት websites እና web apps መስራት ይችላል?",
      },

      {
        label:
          "የስራ ዕድል",

        prompt:
          "ስለ sales representative የስራ ዕድል ንገረኝ።",
      },
    ],
  },
} as const;

/* =========================================================
   HELPERS
   ========================================================= */

function createId() {
  if (
    typeof crypto !==
      "undefined" &&
    "randomUUID" in
      crypto
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

function createGreeting(
  content:
    string,
): ChatMessage {
  return {
    id:
      createId(),

    role:
      "assistant",

    content,
  };
}

/* =========================================================
   AVATAR
   ========================================================= */

function ChatAvatar({
  src,
  alt,
  type,
  size =
    "normal",
}: {
  src:
    string | null;

  alt:
    string;

  type:
    "ai"
    | "user";

  size?:
    "normal"
    | "large";
}) {
  const isLarge =
    size ===
    "large";

  return (
    <div
      className={[
        "relative shrink-0 overflow-hidden rounded-full",
        "border border-black/[0.06]",
        "shadow-sm",

        isLarge
          ? "h-11 w-11"
          : "h-8 w-8",

        type ===
          "ai"
          ? "bg-[#172015]"
          : "bg-[#edf2e9]",
      ].join(
        " ",
      )}
    >
      {src ? (
        <Image
          src={
            src
          }
          alt={
            alt
          }
          fill
          sizes={
            isLarge
              ? "44px"
              : "32px"
          }
          className="object-cover"
        />
      ) : (
        <div
          className="grid h-full w-full place-items-center"
        >
          {type ===
          "ai" ? (
            <Bot
              className={[
                "text-[#9add68]",

                isLarge
                  ? "h-5 w-5"
                  : "h-4 w-4",
              ].join(
                " ",
              )}
            />
          ) : (
            <UserRound
              className={[
                "text-[#426c2b]",

                isLarge
                  ? "h-5 w-5"
                  : "h-4 w-4",
              ].join(
                " ",
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SIMPLE SAFE MARKDOWN
   ========================================================= */

function renderInlineText(
  text:
    string,
) {
  const parts =
    text.split(
      /(\*\*.*?\*\*)/g,
    );

  return parts.map(
    (
      part,
      index,
    ) => {
      const isBold =
        part.startsWith(
          "**",
        ) &&
        part.endsWith(
          "**",
        );

      if (
        isBold
      ) {
        return (
          <strong
            key={`${part}-${index}`}
            className="font-semibold text-[#20251d]"
          >
            {part.slice(
              2,
              -2,
            )}
          </strong>
        );
      }

      return (
        <span
          key={`${part}-${index}`}
        >
          {
            part
          }
        </span>
      );
    },
  );
}

/* =========================================================
   MESSAGE CONTENT
   ========================================================= */

function MessageContent({
  content,
}: {
  content:
    string;
}) {
  const lines =
    content.split(
      "\n",
    );

  return (
    <div
      className="space-y-1.5"
    >
      {lines.map(
        (
          line,
          index,
        ) => {
          const trimmed =
            line.trim();

          if (
            !trimmed
          ) {
            return (
              <div
                key={`space-${index}`}
                className="h-1"
              />
            );
          }

          /* ===============================================
             BULLET
             =============================================== */

          if (
            /^[-•]\s+/.test(
              trimmed,
            )
          ) {
            return (
              <div
                key={`bullet-${index}`}
                className="flex gap-2"
              >
                <span
                  className="
                    mt-[0.52em]
                    h-1
                    w-1
                    shrink-0
                    rounded-full
                    bg-[#6e9a4d]
                  "
                />

                <span>
                  {renderInlineText(
                    trimmed.replace(
                      /^[-•]\s+/,
                      "",
                    ),
                  )}
                </span>
              </div>
            );
          }

          /* ===============================================
             NUMBERED LIST
             =============================================== */

          const numbered =
            trimmed.match(
              /^(\d+)\.\s+(.*)$/,
            );

          if (
            numbered
          ) {
            return (
              <div
                key={`number-${index}`}
                className="flex gap-2"
              >
                <span
                  className="
                    shrink-0
                    font-semibold
                    text-[#557b39]
                  "
                >
                  {
                    numbered[1]
                  }.
                </span>

                <span>
                  {renderInlineText(
                    numbered[2],
                  )}
                </span>
              </div>
            );
          }

          return (
            <p
              key={`line-${index}`}
            >
              {renderInlineText(
                trimmed,
              )}
            </p>
          );
        },
      )}
    </div>
  );
}

/* =========================================================
   THINKING INDICATOR
   ========================================================= */

function TypingIndicator() {
  return (
    <div
      className="flex items-end gap-2.5"
      aria-live="polite"
      aria-label="Baki AI is thinking"
    >
      <ChatAvatar
        src={
          AI_AVATAR_SRC
        }
        alt="Baki AI"
        type="ai"
      />

      <div
        className="
          flex
          items-center
          gap-1.5

          rounded-[18px]
          rounded-bl-[6px]

          border
          border-black/[0.055]

          bg-white

          px-4
          py-3.5

          shadow-[0_8px_30px_rgba(22,30,18,0.06)]
        "
      >
        {[
          0,
          1,
          2,
        ].map(
          (
            item,
          ) => (
            <motion.span
              key={
                item
              }
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-[#719b52]
              "
              animate={{
                y: [
                  0,
                  -4,
                  0,
                ],

                opacity: [
                  0.45,
                  1,
                  0.45,
                ],
              }}
              transition={{
                duration:
                  0.9,

                repeat:
                  Infinity,

                delay:
                  item *
                  0.14,
              }}
            />
          ),
        )}
      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function BakiAiChat() {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const {
    language,
  } =
    useLanguage();

  const copy =
    CHAT_COPY[
      language
    ];

  const [
    isOpen,
    setIsOpen,
  ] =
    useState(
      false,
    );

  const [
    messages,
    setMessages,
  ] =
    useState<
      ChatMessage[]
    >([]);

  const [
    draft,
    setDraft,
  ] =
    useState(
      "",
    );

  /* =======================================================
     THINKING STATE

     True while waiting for first visible AI token.
     ======================================================= */

  const [
    isThinking,
    setIsThinking,
  ] =
    useState(
      false,
    );

  /* =======================================================
     STREAMING MESSAGE
     ======================================================= */

  const [
    streamingMessageId,
    setStreamingMessageId,
  ] =
    useState<
      string | null
    >(
      null,
    );

  /* =======================================================
     CHAT SCROLL CONTAINER

     IMPORTANT:
     This scrolls only the inside of Baki AI.

     It never calls scrollIntoView().
     ======================================================= */

  const messagesContainerRef =
    useRef<
      HTMLDivElement | null
    >(
      null,
    );

  const textareaRef =
    useRef<
      HTMLTextAreaElement | null
    >(
      null,
    );

  const abortControllerRef =
    useRef<
      AbortController | null
    >(
      null,
    );

  const requestVersionRef =
    useRef(
      0,
    );

  const isBusy =
    isThinking ||
    streamingMessageId !==
      null;

  /* =======================================================
     SCROLL CHAT TO BOTTOM

     This function scrolls ONLY the chat's message box.
     ======================================================= */

  function scrollChatToBottom(
    behavior:
      ScrollBehavior =
      "auto",
  ) {
    const container =
      messagesContainerRef.current;

    if (
      !container
    ) {
      return;
    }

    container.scrollTo({
      top:
        container.scrollHeight,

      behavior,
    });
  }

  /* =======================================================
     AUTO SCROLL CHAT

     Never scroll the actual portfolio page.
     ======================================================= */

  useEffect(() => {
    if (
      !isOpen
    ) {
      return;
    }

    /*
      Wait one frame so React has already painted the
      newest message / changed panel size.
    */

    const frame =
      window.requestAnimationFrame(
        () => {
          scrollChatToBottom(
            streamingMessageId
              ? "auto"
              : "smooth",
          );
        },
      );

    return () => {
      window.cancelAnimationFrame(
        frame,
      );
    };
  }, [
    isOpen,
    messages,
    isThinking,
    streamingMessageId,
  ]);

  /* =======================================================
     ESCAPE TO CLOSE
     ======================================================= */

  useEffect(() => {
    function handleEscape(
      event:
        globalThis.KeyboardEvent,
    ) {
      if (
        event.key ===
          "Escape"
      ) {
        setIsOpen(
          false,
        );
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  /* =======================================================
     ABORT ON UNMOUNT
     ======================================================= */

  useEffect(() => {
    return () => {
      abortControllerRef
        .current
        ?.abort();
    };
  }, []);

  /* =======================================================
     OPEN CHAT
     ======================================================= */

  function openChat() {
    setIsOpen(
      true,
    );

    if (
      messages.length ===
        0
    ) {
      setMessages([
        createGreeting(
          copy.greeting,
        ),
      ]);
    }

    /*
      Focus the textbox WITHOUT scrolling the browser page.

      preventScroll is important here.
    */

    window.setTimeout(
      () => {
        textareaRef.current
          ?.focus({
            preventScroll:
              true,
          });

        /*
          Always open at the newest message.
        */

        scrollChatToBottom(
          "auto",
        );
      },
      250,
    );
  }

  /* =======================================================
     TOGGLE CHAT
     ======================================================= */

  function toggleChat() {
    if (
      isOpen
    ) {
      setIsOpen(
        false,
      );

      return;
    }

    openChat();
  }

  /* =======================================================
     RESET CHAT
     ======================================================= */

  function resetChat() {
    requestVersionRef
      .current +=
      1;

    abortControllerRef
      .current
      ?.abort();

    abortControllerRef
      .current =
      null;

    setIsThinking(
      false,
    );

    setStreamingMessageId(
      null,
    );

    setMessages([
      createGreeting(
        copy.greeting,
      ),
    ]);

    setDraft(
      "",
    );

    window.setTimeout(
      () => {
        textareaRef.current
          ?.focus({
            preventScroll:
              true,
          });

        scrollChatToBottom(
          "auto",
        );
      },
      0,
    );
  }

  /* =======================================================
     HOMEPAGE SCROLL
     ======================================================= */

  function goToSection(
    target:
      SectionTarget,
  ) {
    /*
      This scrolling is intentional because the visitor
      clicked a Baki AI navigation action.
    */

    setIsOpen(
      false,
    );

    /* =====================================================
       FROM ANOTHER PAGE
       ===================================================== */

    if (
      pathname !==
      "/"
    ) {
      window.sessionStorage.setItem(
        PENDING_SCROLL_KEY,
        target,
      );

      router.push(
        "/",
      );

      return;
    }

    /* =====================================================
       HOME
       ===================================================== */

    if (
      target ===
      "home"
    ) {
      window.scrollTo({
        top:
          0,

        behavior:
          "smooth",
      });

      return;
    }

    /* =====================================================
       SECTION
       ===================================================== */

    const section =
      document.getElementById(
        target,
      );

    if (
      !section
    ) {
      return;
    }

    const sectionTop =
      section
        .getBoundingClientRect()
        .top +
      window.scrollY;

    const finalPosition =
      Math.max(
        0,

        sectionTop -
          SCROLL_OFFSET,
      );

    window.scrollTo({
      top:
        finalPosition,

      behavior:
        "smooth",
    });
  }

  /* =======================================================
     ACTION CLICK
     ======================================================= */

  function handleAction(
    actionId:
      BakiAiActionId,
  ) {
    const action =
      ACTION_DEFINITIONS[
        actionId
      ];

    if (
      action.kind ===
      "scroll"
    ) {
      goToSection(
        action.target,
      );

      return;
    }

    setIsOpen(
      false,
    );

    if (
      pathname ===
      action.target
    ) {
      window.scrollTo({
        top:
          0,

        behavior:
          "smooth",
      });

      return;
    }

    router.push(
      action.target,
    );
  }

  /* =======================================================
     SEND MESSAGE
     ======================================================= */

  async function sendMessage(
    rawMessage:
      string,
  ) {
    const text =
      rawMessage
        .trim();

    if (
      !text ||
      isBusy
    ) {
      return;
    }

    /* =====================================================
       HISTORY
       ===================================================== */

    const history:
      BakiAiHistoryMessage[] =
        messages
          .filter(
            (
              item,
            ) =>
              !item.isError &&
              Boolean(
                item.content.trim(),
              ),
          )
          .slice(
            -10,
          )
          .map(
            (
              item,
            ) => ({
              role:
                item.role,

              content:
                item.content,
            }),
          );

    /* =====================================================
       USER MESSAGE
       ===================================================== */

    const userMessage:
      ChatMessage = {
        id:
          createId(),

        role:
          "user",

        content:
          text,
      };

    setMessages(
      (
        current,
      ) => [
        ...current,
        userMessage,
      ],
    );

    setDraft(
      "",
    );

    /* =====================================================
       REQUEST STATE
       ===================================================== */

    setIsThinking(
      true,
    );

    setStreamingMessageId(
      null,
    );

    const controller =
      new AbortController();

    abortControllerRef
      .current =
      controller;

    const requestVersion =
      requestVersionRef
        .current +
      1;

    requestVersionRef
      .current =
      requestVersion;

    const assistantMessageId =
      createId();

    let hasStartedStreaming =
      false;

    /*
      If navigation actions arrive before visible text,
      store them here until the assistant bubble exists.
    */

    let latestActions:
      BakiAiActionId[] =
        [];

    try {
      await sendBakiAiMessage({
        message:
          text,

        history,

        language,

        signal:
          controller.signal,

        /* ===============================================
           STREAMED TEXT
           =============================================== */

        onDelta: (
          _delta,
          fullText,
        ) => {
          if (
            requestVersionRef
              .current !==
            requestVersion
          ) {
            return;
          }

          /* =============================================
             FIRST VISIBLE TOKEN
             ============================================= */

          if (
            !hasStartedStreaming
          ) {
            hasStartedStreaming =
              true;

            setIsThinking(
              false,
            );

            setStreamingMessageId(
              assistantMessageId,
            );

            setMessages(
              (
                current,
              ) => [
                ...current,

                {
                  id:
                    assistantMessageId,

                  role:
                    "assistant",

                  content:
                    fullText,

                  actions:
                    latestActions,
                },
              ],
            );

            return;
          }

          /* =============================================
             NEXT TOKENS
             ============================================= */

          setMessages(
            (
              current,
            ) =>
              current.map(
                (
                  item,
                ) =>
                  item.id ===
                  assistantMessageId
                    ? {
                        ...item,

                        content:
                          fullText,
                      }
                    : item,
              ),
          );
        },

        /* ===============================================
           SAFE NAVIGATION ACTIONS
           =============================================== */

        onActions: (
          actions,
        ) => {
          latestActions =
            actions;

          setMessages(
            (
              current,
            ) =>
              current.map(
                (
                  item,
                ) =>
                  item.id ===
                  assistantMessageId
                    ? {
                        ...item,

                        actions,
                      }
                    : item,
              ),
          );
        },
      });
    } catch (
      error
    ) {
      /* ===================================================
         OLD / RESET REQUEST
         =================================================== */

      if (
        requestVersionRef
          .current !==
        requestVersion
      ) {
        return;
      }

      /* ===================================================
         INTENTIONAL ABORT
         =================================================== */

      if (
        error instanceof
          Error &&
        error.name ===
          "AbortError"
      ) {
        return;
      }

      const errorMessage =
        error instanceof
          Error
          ? error.message
          : language ===
              "am"
            ? "Baki AI ለጊዜው መልስ መስጠት አልቻለም።"
            : "Baki AI couldn't respond right now.";

      setMessages(
        (
          current,
        ) => [
          ...current,

          {
            id:
              createId(),

            role:
              "assistant",

            content:
              errorMessage,

            isError:
              true,
          },
        ],
      );
    } finally {
      if (
        requestVersionRef
          .current ===
        requestVersion
      ) {
        setIsThinking(
          false,
        );

        setStreamingMessageId(
          null,
        );

        if (
          abortControllerRef
            .current ===
          controller
        ) {
          abortControllerRef
            .current =
            null;
        }
      }
    }
  }

  /* =======================================================
     SUBMIT
     ======================================================= */

  async function handleSubmit() {
    await sendMessage(
      draft,
    );
  }

  /* =======================================================
     ENTER / SHIFT + ENTER
     ======================================================= */

  function handleKeyDown(
    event:
      KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key ===
        "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      void handleSubmit();
    }
  }

  const showSuggestions =
    messages.length <=
      1 &&
    !isBusy;

  return (
    <>
      {/* ===================================================
          CHAT
          =================================================== */}

      <AnimatePresence>
        {isOpen ? (
          <>
            {/* =============================================
                CLICK OUTSIDE
                ============================================= */}

            <motion.button
              key="baki-ai-backdrop"
              type="button"
              aria-label={
                copy.close
              }
              onClick={() =>
                setIsOpen(
                  false,
                )
              }
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
              exit={{
                opacity:
                  0,
              }}
              className="
                fixed
                inset-0
                z-[9997]
                cursor-default
                bg-transparent
              "
            />

            {/* =============================================
                CHAT PANEL
                ============================================= */}

            <motion.section
              key="baki-ai-panel"
              initial={{
                opacity:
                  0,

                y:
                  18,

                scale:
                  0.96,
              }}
              animate={{
                opacity:
                  1,

                y:
                  0,

                scale:
                  1,
              }}
              exit={{
                opacity:
                  0,

                y:
                  16,

                scale:
                  0.97,
              }}
              transition={{
                duration:
                  0.28,

                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
              className="
                fixed
                bottom-24
                right-3
                z-[9998]

                flex

                h-[min(650px,calc(100dvh-120px))]
                w-[calc(100vw-24px)]
                max-w-[430px]

                flex-col

                overflow-hidden

                rounded-[28px]

                border
                border-black/[0.07]

                bg-white/95

                shadow-[0_28px_90px_rgba(28,43,20,0.18)]

                backdrop-blur-2xl

                sm:bottom-28
                sm:right-6
                sm:w-[420px]
              "
              aria-label="Baki AI chat"
            >
              {/* ===========================================
                  HEADER
                  =========================================== */}

              <header
                className="
                  relative

                  flex
                  shrink-0
                  items-center
                  justify-between

                  overflow-hidden

                  border-b
                  border-black/[0.055]

                  px-4
                  py-3.5
                "
              >
                {/* GLOW */}

                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none

                    absolute
                    -left-14
                    -top-20

                    h-36
                    w-36

                    rounded-full

                    bg-[#bfe49e]/30

                    blur-3xl
                  "
                />

                {/* AI INFO */}

                <div
                  className="
                    relative

                    flex
                    min-w-0
                    items-center
                    gap-3
                  "
                >
                  <ChatAvatar
                    src={
                      AI_AVATAR_SRC
                    }
                    alt="Baki AI"
                    type="ai"
                    size="large"
                  />

                  <div
                    className="min-w-0"
                  >
                    <div
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >
                      <h2
                        className="
                          truncate

                          text-[15px]

                          font-[750]

                          tracking-[-0.025em]

                          text-[#171b15]
                        "
                      >
                        {
                          copy.name
                        }
                      </h2>

                      <Sparkles
                        className="
                          h-3.5
                          w-3.5
                          text-[#6b974c]
                        "
                      />
                    </div>

                    <div
                      className="
                        mt-0.5

                        flex
                        items-center
                        gap-1.5
                      "
                    >
                      <span
                        className="
                          relative
                          flex
                          h-2
                          w-2
                        "
                      >
                        <span
                          className="
                            absolute
                            inline-flex
                            h-full
                            w-full

                            animate-ping

                            rounded-full

                            bg-[#7db859]

                            opacity-30
                          "
                        />

                        <span
                          className="
                            relative
                            inline-flex
                            h-2
                            w-2

                            rounded-full

                            bg-[#6fa44a]
                          "
                        />
                      </span>

                      <span
                        className="
                          truncate

                          text-[11px]

                          font-medium

                          text-black/45
                        "
                      >
                        {
                          copy.ready
                        }
                      </span>

                      <span
                        className="
                          text-black/20
                        "
                      >
                        •
                      </span>

                      <span
                        className="
                          truncate

                          text-[11px]

                          text-black/38
                        "
                      >
                        {
                          copy.subtitle
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* HEADER BUTTONS */}

                <div
                  className="
                    relative

                    flex
                    items-center
                    gap-1
                  "
                >
                  <button
                    type="button"
                    onClick={
                      resetChat
                    }
                    className="
                      grid
                      h-9
                      w-9
                      place-items-center

                      rounded-full

                      text-black/45

                      transition

                      hover:bg-black/[0.045]
                      hover:text-black/70
                    "
                    aria-label={
                      copy.clear
                    }
                    title={
                      copy.clear
                    }
                  >
                    <RefreshCw
                      className="
                        h-4
                        w-4
                      "
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setIsOpen(
                        false,
                      )
                    }
                    className="
                      grid
                      h-9
                      w-9
                      place-items-center

                      rounded-full

                      text-black/45

                      transition

                      hover:bg-black/[0.045]
                      hover:text-black/70
                    "
                    aria-label={
                      copy.close
                    }
                  >
                    <X
                      className="
                        h-[18px]
                        w-[18px]
                      "
                    />
                  </button>
                </div>
              </header>

              {/* ===========================================
                  MESSAGES

                  THIS is the only scrollable area.
                  =========================================== */}

              <div
                ref={
                  messagesContainerRef
                }
                className="
                  min-h-0
                  flex-1

                  overflow-y-auto

                  overscroll-contain

                  bg-[linear-gradient(180deg,#fbfcfa_0%,#f7f9f5_100%)]

                  px-3.5
                  py-5

                  [scrollbar-color:rgba(66,108,43,0.18)_transparent]
                  [scrollbar-width:thin]

                  sm:px-4
                "
              >
                <div
                  className="
                    space-y-4
                  "
                >
                  {messages.map(
                    (
                      message,
                    ) => {
                      const isAi =
                        message.role ===
                        "assistant";

                      const isCurrentlyStreaming =
                        message.id ===
                        streamingMessageId;

                      return (
                        <motion.div
                          key={
                            message.id
                          }
                          initial={{
                            opacity:
                              0,

                            y:
                              8,
                          }}
                          animate={{
                            opacity:
                              1,

                            y:
                              0,
                          }}
                          transition={{
                            duration:
                              0.22,
                          }}
                          className={[
                            "flex w-full items-end gap-2.5",

                            isAi
                              ? "justify-start"
                              : "justify-end",
                          ].join(
                            " ",
                          )}
                        >
                          {/* AI AVATAR LEFT */}

                          {isAi ? (
                            <ChatAvatar
                              src={
                                AI_AVATAR_SRC
                              }
                              alt="Baki AI"
                              type="ai"
                            />
                          ) : null}

                          {/* =================================
                              MESSAGE WRAPPER
                              ================================= */}

                          <div
                            className={[
                              "flex max-w-[82%] flex-col",

                              isAi
                                ? "items-start"
                                : "items-end",
                            ].join(
                              " ",
                            )}
                          >
                            {/* MESSAGE BUBBLE */}

                            <div
                              className={[
                                "px-3.5 py-2.5",

                                "text-[13px]",

                                "leading-[1.58]",

                                isAi
                                  ? [
                                      "rounded-[19px]",
                                      "rounded-bl-[6px]",
                                      "border",
                                      "border-black/[0.055]",
                                      "bg-white",
                                      "text-[#353b31]",
                                      "shadow-[0_8px_30px_rgba(22,30,18,0.045)]",
                                    ].join(
                                      " ",
                                    )
                                  : [
                                      "rounded-[19px]",
                                      "rounded-br-[6px]",
                                      "bg-[#ddefcf]",
                                      "text-[#24311d]",
                                      "shadow-[0_8px_24px_rgba(68,108,43,0.08)]",
                                    ].join(
                                      " ",
                                    ),

                                message.isError
                                  ? "border-red-200 bg-red-50 text-red-700"
                                  : "",
                              ].join(
                                " ",
                              )}
                            >
                              <MessageContent
                                content={
                                  message.content
                                }
                              />

                              {/* STREAMING CURSOR */}

                              {isCurrentlyStreaming ? (
                                <motion.span
                                  aria-hidden="true"
                                  className="
                                    ml-0.5

                                    inline-block

                                    h-[14px]
                                    w-[2px]

                                    translate-y-[2px]

                                    rounded-full

                                    bg-[#6b974c]
                                  "
                                  animate={{
                                    opacity: [
                                      1,
                                      0.15,
                                      1,
                                    ],
                                  }}
                                  transition={{
                                    duration:
                                      0.8,

                                    repeat:
                                      Infinity,
                                  }}
                                />
                              ) : null}
                            </div>

                            {/* =================================
                                SMART NAVIGATION BUTTONS
                                ================================= */}

                            {isAi &&
                            !message.isError &&
                            message.actions &&
                            message.actions.length >
                              0 ? (
                              <motion.div
                                initial={{
                                  opacity:
                                    0,

                                  y:
                                    5,
                                }}
                                animate={{
                                  opacity:
                                    1,

                                  y:
                                    0,
                                }}
                                className="
                                  mt-2

                                  flex
                                  flex-wrap
                                  gap-2
                                "
                              >
                                {message.actions.map(
                                  (
                                    actionId,
                                  ) => {
                                    const action =
                                      ACTION_DEFINITIONS[
                                        actionId
                                      ];

                                    const label =
                                      action.label[
                                        language
                                      ];

                                    return (
                                      <button
                                        key={
                                          actionId
                                        }
                                        type="button"
                                        onClick={() =>
                                          handleAction(
                                            actionId,
                                          )
                                        }
                                        className="
                                          group/action

                                          inline-flex
                                          items-center
                                          gap-2

                                          rounded-full

                                          border
                                          border-[#507d33]/15

                                          bg-[#f2f7ee]

                                          px-3.5
                                          py-2

                                          text-[11px]

                                          font-semibold

                                          text-[#41682d]

                                          shadow-[0_6px_18px_rgba(49,93,32,0.06)]

                                          transition-all
                                          duration-200

                                          hover:-translate-y-0.5
                                          hover:border-[#507d33]/30
                                          hover:bg-[#eaf3e4]
                                          hover:text-[#315820]

                                          active:translate-y-0
                                        "
                                      >
                                        <span>
                                          {
                                            label
                                          }
                                        </span>

                                        <ArrowRight
                                          className="
                                            h-3.5
                                            w-3.5

                                            transition-transform
                                            duration-200

                                            group-hover/action:translate-x-0.5
                                          "
                                        />
                                      </button>
                                    );
                                  },
                                )}
                              </motion.div>
                            ) : null}
                          </div>

                          {/* USER AVATAR RIGHT */}

                          {!isAi ? (
                            <ChatAvatar
                              src={
                                USER_AVATAR_SRC
                              }
                              alt="Visitor"
                              type="user"
                            />
                          ) : null}
                        </motion.div>
                      );
                    },
                  )}

                  {/* =======================================
                      THINKING
                      ======================================= */}

                  {isThinking ? (
                    <TypingIndicator />
                  ) : null}

                  {/* =======================================
                      STARTER QUESTIONS
                      ======================================= */}

                  <AnimatePresence>
                    {showSuggestions ? (
                      <motion.div
                        initial={{
                          opacity:
                            0,

                          y:
                            8,
                        }}
                        animate={{
                          opacity:
                            1,

                          y:
                            0,
                        }}
                        exit={{
                          opacity:
                            0,
                        }}
                        transition={{
                          delay:
                            0.08,
                        }}
                        className="
                          ml-10

                          flex
                          flex-wrap
                          gap-2

                          pt-1
                        "
                      >
                        {copy.suggestions.map(
                          (
                            suggestion,
                          ) => (
                            <button
                              key={
                                suggestion.label
                              }
                              type="button"
                              onClick={() =>
                                void sendMessage(
                                  suggestion.prompt,
                                )
                              }
                              className="
                                rounded-full

                                border
                                border-[#426c2b]/12

                                bg-white

                                px-3
                                py-2

                                text-[11px]

                                font-semibold

                                text-[#476b32]

                                shadow-[0_5px_18px_rgba(41,62,29,0.04)]

                                transition

                                hover:-translate-y-0.5
                                hover:border-[#426c2b]/25
                                hover:bg-[#f6faf3]
                              "
                            >
                              {
                                suggestion.label
                              }
                            </button>
                          ),
                        )}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>

              {/* ===========================================
                  INPUT
                  =========================================== */}

              <footer
                className="
                  shrink-0

                  border-t
                  border-black/[0.055]

                  bg-white

                  p-3
                "
              >
                <form
                  onSubmit={(
                    event,
                  ) => {
                    event.preventDefault();

                    void handleSubmit();
                  }}
                  className="
                    flex
                    items-end
                    gap-2

                    rounded-[20px]

                    border
                    border-black/[0.075]

                    bg-[#fafbf9]

                    p-1.5

                    transition

                    focus-within:border-[#668d4a]/35
                    focus-within:bg-white
                    focus-within:shadow-[0_0_0_4px_rgba(99,143,70,0.07)]
                  "
                >
                  <textarea
                    ref={
                      textareaRef
                    }
                    value={
                      draft
                    }
                    onChange={(
                      event,
                    ) =>
                      setDraft(
                        event
                          .target
                          .value
                          .slice(
                            0,
                            1200,
                          ),
                      )
                    }
                    onKeyDown={
                      handleKeyDown
                    }
                    rows={
                      1
                    }
                    maxLength={
                      1200
                    }
                    placeholder={
                      copy.placeholder
                    }
                    disabled={
                      isBusy
                    }
                    className="
                      max-h-28
                      min-h-[42px]

                      flex-1

                      resize-none

                      bg-transparent

                      px-3
                      py-2.5

                      text-[13px]

                      leading-5

                      text-[#20251d]

                      outline-none

                      placeholder:text-black/30

                      disabled:cursor-not-allowed
                    "
                  />

                  <button
                    type="submit"
                    disabled={
                      isBusy ||
                      !draft.trim()
                    }
                    className="
                      grid
                      h-10
                      w-10
                      shrink-0
                      place-items-center

                      rounded-[14px]

                      bg-[#315a1f]

                      text-white

                      shadow-[0_8px_20px_rgba(49,90,31,0.18)]

                      transition

                      hover:bg-[#426c2b]

                      disabled:cursor-not-allowed
                      disabled:bg-black/10
                      disabled:text-black/25
                      disabled:shadow-none
                    "
                    aria-label={
                      copy.send
                    }
                  >
                    <Send
                      className="
                        h-4
                        w-4
                      "
                    />
                  </button>
                </form>

                <div
                  className="
                    mt-2

                    flex
                    items-center
                    justify-center
                    gap-1.5

                    px-2

                    text-center

                    text-[9.5px]

                    font-medium

                    leading-4

                    text-black/32
                  "
                >
                  <Sparkles
                    className="
                      h-3
                      w-3
                      shrink-0
                      text-[#70994f]/65
                    "
                  />

                  <span>
                    {
                      copy.disclaimer
                    }
                  </span>
                </div>
              </footer>
            </motion.section>
          </>
        ) : null}
      </AnimatePresence>

      {/* ===================================================
          FLOATING LAUNCHER
          =================================================== */}

      <div
        className="
          group

          fixed

          bottom-5
          right-4

          z-[9999]

          sm:bottom-6
          sm:right-6
        "
      >
        {/* ===============================================
            TOOLTIP
            =============================================== */}

        <AnimatePresence>
          {!isOpen ? (
            <motion.div
              initial={{
                opacity:
                  0,

                x:
                  8,
              }}
              animate={{
                opacity:
                  1,

                x:
                  0,
              }}
              exit={{
                opacity:
                  0,

                x:
                  8,
              }}
              className="
                pointer-events-none

                absolute

                right-[78px]
                top-1/2

                hidden

                -translate-y-1/2

                whitespace-nowrap

                rounded-full

                border
                border-black/[0.055]

                bg-white/95

                px-3
                py-2

                text-[11px]

                font-semibold

                text-[#3a4d2d]

                opacity-0

                shadow-[0_10px_32px_rgba(27,40,19,0.1)]

                backdrop-blur-xl

                transition-opacity

                group-hover:opacity-100

                sm:block
              "
            >
              {
                copy.tooltip
              }
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* ===============================================
            LAUNCH BUTTON
            =============================================== */}

        <motion.button
          type="button"
          onClick={
            toggleChat
          }
          whileHover={{
            scale:
              1.045,
          }}
          whileTap={{
            scale:
              0.94,
          }}
          transition={{
            type:
              "spring",

            stiffness:
              420,

            damping:
              24,
          }}
          className="
            relative

            grid

            h-[70px]
            w-[70px]

            place-items-center

            rounded-full

            border
            border-[#6d9c4a]/15

            bg-[#c9e2b6]

            shadow-[0_12px_38px_rgba(55,91,36,0.23)]

            outline-none

            sm:h-[74px]
            sm:w-[74px]
          "
          aria-label={
            isOpen
              ? copy.close
              : copy.tooltip
          }
          aria-expanded={
            isOpen
          }
        >
          {/* =============================================
              BREATHING GLOW
              ============================================= */}

          {!isOpen ? (
            <motion.span
              aria-hidden="true"
              className="
                absolute
                inset-0

                rounded-full

                border
                border-[#80ad5d]/25
              "
              animate={{
                scale: [
                  1,
                  1.18,
                  1.18,
                ],

                opacity: [
                  0.45,
                  0,
                  0,
                ],
              }}
              transition={{
                duration:
                  2.3,

                repeat:
                  Infinity,

                ease:
                  "easeOut",
              }}
            />
          ) : null}

          {/* =============================================
              INNER CIRCLE
              ============================================= */}

          <span
            className="
              relative

              grid

              h-[52px]
              w-[52px]

              place-items-center

              overflow-hidden

              rounded-full

              bg-[#171a16]

              shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_18px_rgba(22,30,17,0.24)]

              sm:h-[56px]
              sm:w-[56px]
            "
          >
            <span
              aria-hidden="true"
              className="
                absolute

                left-1/2
                top-1/2

                h-8
                w-8

                -translate-x-1/2
                -translate-y-1/2

                rounded-full

                bg-[#84c55a]/15

                blur-lg
              "
            />

            <AnimatePresence
              mode="wait"
              initial={
                false
              }
            >
              {isOpen ? (
                <motion.span
                  key="close"
                  initial={{
                    rotate:
                      -45,

                    opacity:
                      0,
                  }}
                  animate={{
                    rotate:
                      0,

                    opacity:
                      1,
                  }}
                  exit={{
                    rotate:
                      45,

                    opacity:
                      0,
                  }}
                >
                  <X
                    className="
                      relative
                      h-5
                      w-5
                      text-white
                    "
                  />
                </motion.span>
              ) : (
                <motion.span
                  key="ai"
                  initial={{
                    scale:
                      0.75,

                    opacity:
                      0,
                  }}
                  animate={{
                    scale:
                      1,

                    opacity:
                      1,
                  }}
                  exit={{
                    scale:
                      0.75,

                    opacity:
                      0,
                  }}
                  className="relative"
                >
                  {AI_AVATAR_SRC ? (
                    <span
                      className="
                        relative

                        block

                        h-9
                        w-9

                        overflow-hidden

                        rounded-full
                      "
                    >
                      <Image
                        src={
                          AI_AVATAR_SRC
                        }
                        alt="Baki AI"
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    </span>
                  ) : (
                    <span
                      className="
                        relative

                        grid

                        h-8
                        w-8

                        place-items-center

                        rounded-full

                        border
                        border-white/20

                        bg-white/[0.06]
                      "
                    >
                      <Bot
                        className="
                          h-[18px]
                          w-[18px]
                          text-[#9ee56c]
                        "
                      />

                      <span
                        className="
                          absolute

                          right-[3px]
                          top-[3px]

                          h-1.5
                          w-1.5

                          rounded-full

                          bg-[#9eed68]

                          shadow-[0_0_8px_#9eed68]
                        "
                      />
                    </span>
                  )}
                </motion.span>
              )}
            </AnimatePresence>
          </span>

          {/* =============================================
              ONLINE DOT
              ============================================= */}

          {!isOpen ? (
            <span
              className="
                absolute

                bottom-[7px]
                right-[6px]

                h-3.5
                w-3.5

                rounded-full

                border-[3px]
                border-[#c9e2b6]

                bg-[#71ad4d]
              "
            />
          ) : null}
        </motion.button>
      </div>
    </>
  );
}