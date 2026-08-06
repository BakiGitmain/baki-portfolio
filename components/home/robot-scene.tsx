"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useLanguage } from "@/components/providers/language-provider";
import { useLoading } from "@/components/providers/loading-provider";
import {
  useAdaptiveMobile3D,
  type RobotFallbackReason,
} from "@/hooks/use-adaptive-mobile-3d";

const Spline = dynamic(
  () => import("@splinetool/react-spline"),
  {
    ssr: false,

    loading: () => (
      <div
        className="h-full w-full"
        aria-hidden="true"
      />
    ),
  },
);

const SPLINE_SCENE_URL =
  "https://prod.spline.design/Mi2blRidcGffVQCF/scene.splinecode";

const FALLBACK_IMAGE_URL =
  "/images/robot-mobile-fallback.png";

const SPLINE_TIMEOUT_MS = 45_000;

const adaptiveCopy = {
  en: {
    imageAlt:
      "Lightweight illustration of Baki's AI robot",

    performanceMode: "Performance mode",
    try3d: "Try interactive 3D",
    useLite: "Use lightweight mode",
    interactive3d: "Interactive 3D",

    fallbackAnnouncement:
      "Lightweight robot mode enabled for smoother performance.",

    interactiveAnnouncement:
      "Interactive 3D robot enabled.",
  },

  am: {
    imageAlt: "የባኪ AI ሮቦት ቀላል ምስል",

    performanceMode: "የፍጥነት ሁነታ",
    try3d: "ተግባራዊ 3D ሞክር",
    useLite: "ቀላል ሁነታ ተጠቀም",
    interactive3d: "ተግባራዊ 3D",

    fallbackAnnouncement:
      "ለተሻለ ፍጥነት ቀላል የሮቦት ሁነታ ተከፍቷል።",

    interactiveAnnouncement:
      "ተግባራዊ 3D ሮቦት ተከፍቷል።",
  },
} as const;

function PerformanceIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M10 3.2A6.8 6.8 0 1 0 16.8 10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M10 10L14.7 6.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle
        cx="10"
        cy="10"
        r="1.3"
        fill="currentColor"
      />
    </svg>
  );
}

function CubeIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M10 2.8L16 6.2V13.8L10 17.2L4 13.8V6.2L10 2.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      <path
        d="M4.4 6.4L10 9.7L15.6 6.4M10 9.7V16.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getReasonLabel(
  reason: RobotFallbackReason,
  language: "en" | "am",
) {
  if (language === "am") {
    switch (reason) {
      case "low-memory":
      case "low-cpu":
        return "ለዚህ መሣሪያ የተመቻቸ";

      case "sustained-lag":
        return "ፍጥነት ተመቻችቷል";

      case "reduced-motion":
        return "እንቅስቃሴ ቀንሷል";

      default:
        return "የፍጥነት ሁነታ";
    }
  }

  switch (reason) {
    case "low-memory":
    case "low-cpu":
      return "Optimized for this device";

    case "sustained-lag":
      return "Performance optimized";

    case "reduced-motion":
      return "Reduced motion";

    default:
      return "Performance mode";
  }
}

export default function RobotScene() {
  const wrapperRef =
    useRef<HTMLDivElement | null>(null);

  const [sceneLoaded, setSceneLoaded] =
    useState(false);

  const [posterLoaded, setPosterLoaded] =
    useState(false);

  const [posterFailed, setPosterFailed] =
    useState(false);

  const {
    completeTask,
    failTask,
    hasRevealed,
  } = useLoading();

  const { language } = useLanguage();

  const {
    mode,
    reason,
    isMobile,
    sceneAttempt,
    activateImage,
    tryInteractive3D,
    useLightweightMode,
  } = useAdaptiveMobile3D({
    monitorEnabled:
      sceneLoaded && hasRevealed,
  });

  const copy = adaptiveCopy[language];

  const handleSplineLoad =
    useCallback(() => {
      setSceneLoaded(true);
      completeTask("scene3d");
    }, [completeTask]);

  const handleTry3D =
    useCallback(() => {
      setSceneLoaded(false);
      tryInteractive3D();
    }, [tryInteractive3D]);

  /*
   * If image mode is selected, its actual image load event
   * completes the scene loading task.
   */
  useEffect(() => {
    if (mode !== "image") {
      return;
    }

    if (posterLoaded) {
      completeTask("scene3d");
      return;
    }

    if (posterFailed) {
      failTask("scene3d");
    }
  }, [
    completeTask,
    failTask,
    mode,
    posterFailed,
    posterLoaded,
  ]);

  /*
   * Fall back when the Spline scene takes too long to load.
   */
  useEffect(() => {
    if (
      mode !== "3d" ||
      sceneLoaded
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      failTask("scene3d");
      activateImage("spline-timeout");
    }, SPLINE_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    activateImage,
    failTask,
    mode,
    sceneAttempt,
    sceneLoaded,
  ]);

  /*
   * Fall back immediately if the browser loses WebGL.
   */
  useEffect(() => {
    if (
      mode !== "3d" ||
      !sceneLoaded
    ) {
      return;
    }

    const canvas =
      wrapperRef.current?.querySelector("canvas");

    if (!canvas) {
      return;
    }

    function handleContextLoss(event: Event) {
      event.preventDefault();

      activateImage("webgl-context-lost");
    }

    canvas.addEventListener(
      "webglcontextlost",
      handleContextLoss,
    );

    return () => {
      canvas.removeEventListener(
        "webglcontextlost",
        handleContextLoss,
      );
    };
  }, [
    activateImage,
    mode,
    sceneLoaded,
  ]);

  const shouldRenderPoster =
    isMobile || mode === "image";

  const posterVisible =
    mode === "image" ||
    (
      mode === "3d" &&
      (
        !sceneLoaded ||
        !hasRevealed
      )
    );

  const statusAnnouncement =
    mode === "image"
      ? copy.fallbackAnnouncement
      : copy.interactiveAnnouncement;

  if (mode === "checking") {
    return (
      <div
        className="absolute inset-0"
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="absolute inset-0">
      {/* Mobile poster and lightweight fallback */}
      {shouldRenderPoster && (
        <div
          className={`
            absolute inset-0 z-0
            transition-all duration-700
            ease-[cubic-bezier(0.22,1,0.36,1)]
            ${
              posterVisible
                ? "opacity-100 blur-0"
                : "pointer-events-none opacity-0 blur-[2px]"
            }
          `}
        >
          {!posterFailed ? (
            <div
              className={`
                relative h-full w-full
                transition-transform duration-300
                active:scale-[0.99]
                ${
                  mode === "image"
                    ? "robot-mobile-poster-float"
                    : ""
                }
              `}
            >
              <Image
                fill
                src={FALLBACK_IMAGE_URL}
                alt={copy.imageAlt}
                loading="eager"
                fetchPriority="high"
                sizes="(max-width: 767px) 100vw, 50vw"
                draggable={false}
                onLoad={() => {
                  setPosterLoaded(true);
                }}
                onError={() => {
                  setPosterFailed(true);
                }}
                className="
                  translate-y-[3%]
                  scale-[1.13]
                  select-none
                  object-contain
                  object-center
                "
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border border-[#4b702f]/15 bg-white/70 font-mono text-2xl font-bold text-[#4b702f] shadow-[0_18px_50px_rgba(49,90,31,0.10)] backdrop-blur">
                &lt;/&gt;
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Spline robot */}
      {mode === "3d" && (
        <div
          ref={wrapperRef}
          className={`
            spline-shell absolute inset-0 z-10
            overflow-hidden
            ${
              sceneLoaded && hasRevealed
                ? "spline-shell--revealed"
                : "spline-shell--waiting"
            }
          `}
        >
          <div className="absolute inset-0 scale-[1.12] sm:scale-[1.08] lg:translate-x-[4%] lg:scale-[1.18]">
            <Spline
              key={`robot-scene-${sceneAttempt}`}
              scene={SPLINE_SCENE_URL}
              onLoad={handleSplineLoad}
              className="h-full w-full"
            />
          </div>
        </div>
      )}

      {/* Mobile performance mode control */}
      {(isMobile || mode === "image") && (
        <button
          type="button"
          onClick={
            mode === "image"
              ? handleTry3D
              : useLightweightMode
          }
          aria-label={
            mode === "image"
              ? copy.try3d
              : copy.useLite
          }
          className={`
            group absolute bottom-3 left-3 z-[50]
            inline-flex max-w-[calc(100%-1.5rem)]
            items-center gap-2 rounded-full
            border border-black/[0.07]
            bg-white/88 px-3 py-2
            text-[11px] font-semibold text-[#26331f]
            shadow-[0_12px_35px_rgba(30,47,20,0.12)]
            backdrop-blur-xl
            transition-all duration-300
            hover:-translate-y-0.5
            hover:border-[#4b702f]/20
            hover:bg-white
            hover:shadow-[0_17px_42px_rgba(30,47,20,0.17)]
            active:translate-y-0
            active:scale-[0.98]
            sm:bottom-4 sm:left-4
            sm:px-3.5 sm:py-2.5
            sm:text-xs
          `}
        >
          <span
            className={`
              flex h-7 w-7 shrink-0
              items-center justify-center
              rounded-full bg-[#edf4e8]
              text-[#4b702f]
              transition-transform duration-300
              group-hover:scale-105
            `}
          >
            {mode === "image" ? (
              <CubeIcon />
            ) : (
              <PerformanceIcon />
            )}
          </span>

          <span className="flex min-w-0 flex-col items-start leading-tight">
            <span className="truncate font-bold">
              {mode === "image"
                ? getReasonLabel(
                    reason,
                    language,
                  )
                : copy.interactive3d}
            </span>

            <span className="mt-0.5 truncate text-[9px] font-medium text-black/42 sm:text-[10px]">
              {mode === "image"
                ? copy.try3d
                : copy.useLite}
            </span>
          </span>

          <span
            className={`
              ml-0.5 text-sm text-[#4b702f]
              transition-transform duration-300
              group-hover:translate-x-0.5
            `}
            aria-hidden="true"
          >
            →
          </span>
        </button>
      )}

      <p
        className="sr-only"
        aria-live="polite"
      >
        {statusAnnouncement}
      </p>

      <style jsx global>{`
        .robot-mobile-poster-float {
          animation:
            robot-mobile-poster-float
            5.5s
            ease-in-out
            infinite;
          transform-origin: 50% 58%;
          will-change: transform;
        }

        @keyframes robot-mobile-poster-float {
          0%,
          100% {
            transform:
              translate3d(0, 0, 0)
              rotate(0deg);
          }

          50% {
            transform:
              translate3d(0, -7px, 0)
              rotate(0.25deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .robot-mobile-poster-float {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}