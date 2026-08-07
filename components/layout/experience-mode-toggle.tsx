"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";

import { useLoading } from "@/components/providers/loading-provider";
import { useLanguage } from "@/components/providers/language-provider";

import {
  useExperienceMode,
  type ExperienceMode,
} from "@/components/providers/experience-mode-provider";

function PerformanceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-[17px] w-[17px] xl:h-[19px] xl:w-[19px]"
      aria-hidden="true"
    >
      <path
        d="M4.7 17.4A8.2 8.2 0 1 1 19.3 17.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M12 12L17 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="12"
        r="1.5"
        fill="currentColor"
      />

      <path
        d="M12 4.1V6M5.8 7.2L7.3 8.3M18.2 7.2L16.7 8.3M3.9 13H6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function QualityIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-[17px] w-[17px] xl:h-[19px] xl:w-[19px]"
      aria-hidden="true"
    >
      <path
        d="M11.8 3.5C11.8 8.4 8.4 11.8 3.5 11.8C8.4 11.8 11.8 15.2 11.8 20.1C11.8 15.2 15.2 11.8 20.1 11.8C15.2 11.8 11.8 8.4 11.8 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      <path
        d="M19 3V6M17.5 4.5H20.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M10 2.8C10 6.5 7.5 9 3.8 9C7.5 9 10 11.5 10 15.2C10 11.5 12.5 9 16.2 9C12.5 9 10 6.5 10 2.8Z"
        fill="currentColor"
      />

      <circle
        cx="15.8"
        cy="4.2"
        r="1.2"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  );
}

const modeOptions: {
  value: ExperienceMode;
  icon: typeof PerformanceIcon;
}[] = [
  {
    value: "performance",
    icon: PerformanceIcon,
  },
  {
    value: "quality",
    icon: QualityIcon,
  },
];

/*
 * Change these whenever you want.
 */
const NOTIFICATION_DELAY = 7_000;
const NOTIFICATION_VISIBLE_TIME = 4_000;
const NOTIFICATION_EXIT_TIME = 450;

type NotificationPosition = {
  top: number;
  left: number;
  arrowLeft: number;
  width: number;
};

export default function ExperienceModeToggle() {
  const {
    mode,
    setExperienceMode,
  } = useExperienceMode();

  const { language } =
    useLanguage();

  const { hasRevealed } =
    useLoading();

  const performanceButtonRef =
    useRef<HTMLButtonElement | null>(
      null,
    );

  const hasShownRef =
    useRef(false);

  const [
    notificationMounted,
    setNotificationMounted,
  ] = useState(false);

  const [
    notificationVisible,
    setNotificationVisible,
  ] = useState(false);

  const [
    notificationPosition,
    setNotificationPosition,
  ] =
    useState<NotificationPosition | null>(
      null,
    );

  const labels =
    language === "am"
      ? {
          performance: "ፍጥነት",
          quality: "ጥራት",

          group:
            "የድረ-ገጽ አፈጻጸም ሁነታ",

          notificationTitle:
            "የተሻለ ፍጥነት ይፈልጋሉ?",

          notification:
            "ለለስላሳ እና ፈጣን ልምድ Performance mode ይጠቀሙ።",

          switchNow:
            "Performance ይጠቀሙ",
        }
      : {
          performance: "Performance",
          quality: "Quality",

          group:
            "Website performance mode",

          notificationTitle:
            "Want a smoother experience?",

          notification:
            "Switch to Performance mode for faster and smoother browsing.",

          switchNow:
            "Switch to Performance",
        };

  /*
   * Calculates the notification position from the
   * ACTUAL Performance button position.
   *
   * Because the notification is rendered into document.body,
   * navbar overflow can no longer clip it.
   */
  const calculateNotificationPosition =
    useCallback(() => {
      const button =
        performanceButtonRef.current;

      if (!button) {
        return;
      }

      const rect =
        button.getBoundingClientRect();

      const viewportWidth =
        window.innerWidth;

      /*
       * Smaller notification on mobile.
       */
      const width =
        viewportWidth < 640
          ? Math.min(
              260,
              viewportWidth - 24,
            )
          : 290;

      const screenPadding = 12;

      const targetCenter =
        rect.left +
        rect.width / 2;

      let left =
        targetCenter -
        width / 2;

      /*
       * Don't allow the tooltip to escape the left side.
       */
      left = Math.max(
        screenPadding,
        left,
      );

      /*
       * Don't allow it to escape the right side.
       */
      left = Math.min(
        left,
        viewportWidth -
          width -
          screenPadding,
      );

      /*
       * Arrow position INSIDE the notification.
       * This always points at the Performance button.
       */
      const rawArrowLeft =
        targetCenter -
        left;

      const arrowLeft = Math.max(
        18,
        Math.min(
          width - 18,
          rawArrowLeft,
        ),
      );

      setNotificationPosition({
        top: rect.bottom + 14,
        left,
        arrowLeft,
        width,
      });
    }, []);

  /*
   * Main notification timer.
   *
   * Page appears
   * ↓
   * wait 7 sec
   * ↓
   * show
   * ↓
   * stay 4 sec
   * ↓
   * smoothly disappear
   */
  useEffect(() => {
    if (
      !hasRevealed ||
      mode !== "quality" ||
      hasShownRef.current
    ) {
      return;
    }

    let visibleTimer = 0;
    let removeTimer = 0;
    let animationFrame = 0;

    const showTimer =
      window.setTimeout(() => {
        const button =
          performanceButtonRef.current;

        if (!button) {
          return;
        }

        hasShownRef.current = true;

        calculateNotificationPosition();

        setNotificationMounted(
          true,
        );

        animationFrame =
          window.requestAnimationFrame(
            () => {
              setNotificationVisible(
                true,
              );
            },
          );

        visibleTimer =
          window.setTimeout(() => {
            setNotificationVisible(
              false,
            );

            removeTimer =
              window.setTimeout(
                () => {
                  setNotificationMounted(
                    false,
                  );
                },
                NOTIFICATION_EXIT_TIME,
              );
          }, NOTIFICATION_VISIBLE_TIME);
      }, NOTIFICATION_DELAY);

    return () => {
      window.clearTimeout(
        showTimer,
      );

      window.clearTimeout(
        visibleTimer,
      );

      window.clearTimeout(
        removeTimer,
      );

      window.cancelAnimationFrame(
        animationFrame,
      );
    };
  }, [
    calculateNotificationPosition,
    hasRevealed,
    mode,
  ]);

  /*
   * Keep the notification attached to the
   * Performance button when:
   *
   * - screen rotates
   * - browser resizes
   * - navbar moves
   * - user scrolls
   */
  useEffect(() => {
    if (!notificationMounted) {
      return;
    }

    let frame = 0;

    function updatePosition() {
      window.cancelAnimationFrame(
        frame,
      );

      frame =
        window.requestAnimationFrame(
          () => {
            calculateNotificationPosition();
          },
        );
    }

    window.addEventListener(
      "resize",
      updatePosition,
      {
        passive: true,
      },
    );

    window.addEventListener(
      "scroll",
      updatePosition,
      {
        passive: true,
      },
    );

    return () => {
      window.cancelAnimationFrame(
        frame,
      );

      window.removeEventListener(
        "resize",
        updatePosition,
      );

      window.removeEventListener(
        "scroll",
        updatePosition,
      );
    };
  }, [
    calculateNotificationPosition,
    notificationMounted,
  ]);

  /*
   * If Performance mode becomes active while
   * the notification is open, hide it.
   */
  useEffect(() => {
    if (
      mode !== "performance" ||
      !notificationMounted
    ) {
      return;
    }

    const frame =
      window.requestAnimationFrame(
        () => {
          setNotificationVisible(
            false,
          );
        },
      );

    const timer =
      window.setTimeout(() => {
        setNotificationMounted(
          false,
        );
      }, NOTIFICATION_EXIT_TIME);

    return () => {
      window.cancelAnimationFrame(
        frame,
      );

      window.clearTimeout(
        timer,
      );
    };
  }, [
    mode,
    notificationMounted,
  ]);

  function switchToPerformance() {
    setNotificationVisible(false);

    setExperienceMode(
      "performance",
      {
        persist: true,
      },
    );
  }

  function handleModeChange(
    nextMode: ExperienceMode,
  ) {
    if (
      nextMode === "performance"
    ) {
      setNotificationVisible(
        false,
      );
    }

    setExperienceMode(
      nextMode,
      {
        persist: true,
      },
    );
  }

  return (
    <>
      {/* =====================================================
          PERFORMANCE / QUALITY SWITCH
         ===================================================== */}

      <div className="relative shrink-0">
        <div
          role="group"
          aria-label={
            labels.group
          }
          className={`
            relative

            grid
            h-10
            w-[72px]
            shrink-0
            grid-cols-2

            rounded-[14px]

            border
            border-black/[0.08]

            bg-white/80
            p-1

            shadow-[0_8px_26px_rgba(31,48,22,0.07)]

            backdrop-blur-xl

            transition-all
            duration-300

            hover:border-[#79b84a]/25
            hover:bg-white

            hover:shadow-[0_12px_34px_rgba(67,106,40,0.11)]

            xl:h-12
            xl:w-[220px]
            xl:rounded-full
          `}
        >
          {/* SELECTED BACKGROUND */}

          <span
            aria-hidden="true"
            className={`
              pointer-events-none

              absolute
              bottom-1
              left-1
              top-1

              w-[calc(50%-4px)]

              rounded-[11px]

              border
              border-[#98ce62]/25

              bg-[linear-gradient(135deg,rgba(242,255,219,0.98),rgba(248,255,235,0.94))]

              shadow-[0_7px_22px_rgba(101,158,56,0.13),inset_0_0_20px_rgba(194,255,120,0.18)]

              transition-transform
              duration-500

              ease-[cubic-bezier(0.22,1,0.36,1)]

              xl:rounded-full

              ${
                mode === "quality"
                  ? "translate-x-full"
                  : "translate-x-0"
              }
            `}
          />

          {modeOptions.map(
            (option) => {
              const Icon =
                option.icon;

              const active =
                option.value ===
                mode;

              const label =
                labels[
                  option.value
                ];

              return (
                <button
                  ref={
                    option.value ===
                    "performance"
                      ? performanceButtonRef
                      : undefined
                  }
                  key={
                    option.value
                  }
                  type="button"
                  title={label}
                  aria-label={
                    label
                  }
                  aria-pressed={
                    active
                  }
                  onClick={() => {
                    handleModeChange(
                      option.value,
                    );
                  }}
                  className={`
                    group

                    relative
                    z-10

                    flex
                    min-w-0
                    items-center
                    justify-center
                    gap-2

                    rounded-full

                    transition-all
                    duration-300

                    ${
                      active
                        ? "text-[#4a782d]"
                        : "text-black/43 hover:text-[#4a782d]"
                    }
                  `}
                >
                  <span
                    className={`
                      transition-all
                      duration-300

                      ${
                        active
                          ? "scale-100"
                          : "scale-[0.92] group-hover:scale-100"
                      }
                    `}
                  >
                    <Icon />
                  </span>

                  <span className="hidden text-[12px] font-semibold xl:inline">
                    {label}
                  </span>

                  {active && (
                    <span
                      className={`
                        pointer-events-none

                        absolute
                        inset-0
                        -z-10

                        rounded-full

                        bg-[#aee56d]/5
                        blur-lg
                      `}
                    />
                  )}
                </button>
              );
            },
          )}
        </div>
      </div>

      {/* =====================================================
          FLOATING PERFORMANCE NOTIFICATION

          PORTAL means:
          - navbar cannot clip it
          - page width is unaffected
          - arrow can target exact Performance button
         ===================================================== */}

      {notificationMounted &&
        notificationPosition &&
        typeof document !==
          "undefined" &&
        createPortal(
          <button
            type="button"
            onClick={
              switchToPerformance
            }
            aria-label={
              labels.switchNow
            }
            style={{
              top: `${notificationPosition.top}px`,
              left: `${notificationPosition.left}px`,
              width: `${notificationPosition.width}px`,
            }}
            className={`
              group

              fixed
              z-[9999]

              rounded-[18px]

              border
              border-[#7eaa58]/20

              bg-white/[0.97]

              px-3.5
              pb-4
              pt-3.5

              text-left

              shadow-[0_20px_55px_rgba(39,62,25,0.16),0_4px_16px_rgba(39,62,25,0.08)]

              backdrop-blur-2xl

              transition-[opacity,transform,filter]
              duration-[450ms]

              ease-[cubic-bezier(0.22,1,0.36,1)]

              ${
                notificationVisible
                  ? "translate-y-0 scale-100 opacity-100 blur-0"
                  : "-translate-y-2 scale-[0.96] opacity-0 blur-[4px]"
              }
            `}
          >
            {/* =================================================
                ARROW

                Exact position is calculated from the actual
                Performance button, not the whole toggle.
               ================================================= */}

            <span
              aria-hidden="true"
              style={{
                left: `${notificationPosition.arrowLeft}px`,
              }}
              className={`
                absolute
                top-[-6px]

                h-3
                w-3

                -translate-x-1/2
                rotate-45

                border-l
                border-t
                border-[#7eaa58]/20

                bg-white
              `}
            />

            {/* CONTENT */}

            <div className="relative flex items-start gap-3">
              <span
                className={`
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center

                  rounded-full

                  border
                  border-[#91c768]/15

                  bg-[linear-gradient(135deg,#edf8df,#f8ffed)]

                  text-[#689f3d]

                  shadow-[0_7px_18px_rgba(105,159,61,0.14)]

                  transition-transform
                  duration-300

                  group-hover:scale-105
                `}
              >
                <SparkIcon />
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={`
                    text-[12px]
                    font-bold
                    leading-[1.25]
                    tracking-[-0.015em]
                    text-[#172012]

                    sm:text-[13px]
                  `}
                >
                  {
                    labels.notificationTitle
                  }
                </p>

                <p
                  className={`
                    mt-1

                    text-[10px]
                    leading-[1.5]
                    text-black/45

                    sm:text-[11px]
                  `}
                >
                  {
                    labels.notification
                  }
                </p>

                <div
                  className={`
                    mt-2.5

                    flex
                    items-center
                    gap-1.5

                    text-[10px]
                    font-bold
                    text-[#568531]
                  `}
                >
                  <PerformanceIcon />

                  <span>
                    {
                      labels.switchNow
                    }
                  </span>

                  <span
                    aria-hidden="true"
                    className={`
                      ml-0.5

                      transition-transform
                      duration-300

                      group-hover:translate-x-1
                    `}
                  >
                    →
                  </span>
                </div>
              </div>
            </div>

            {/* =================================================
                TIMER BAR
               ================================================= */}

            <span
              aria-hidden="true"
              className={`
                absolute
                bottom-[6px]
                left-4
                right-4

                h-[2px]

                overflow-hidden
                rounded-full

                bg-[#4b702f]/5
              `}
            >
              {notificationVisible && (
                <span
                  className={`
                    performance-hint-progress

                    block
                    h-full
                    w-full

                    origin-left
                    rounded-full

                    bg-[#83bd53]/45
                  `}
                />
              )}
            </span>
          </button>,
          document.body,
        )}

      <style jsx global>{`
        .performance-hint-progress {
          animation:
            performance-hint-progress
            4s
            linear
            forwards;
        }

        @keyframes performance-hint-progress {
          from {
            transform: scaleX(1);
          }

          to {
            transform: scaleX(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .performance-hint-progress {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}