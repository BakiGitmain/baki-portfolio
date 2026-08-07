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
import { useAdaptiveMobile3D } from "@/hooks/use-adaptive-mobile-3d";

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

const ABOUT_SCENE_URL =
  "https://prod.spline.design/zeXjgYQeqkfNnKAM/scene.splinecode";

const ABOUT_FALLBACK_IMAGE =
  "/images/about-3d-fallback.png";

const SPLINE_TIMEOUT_MS = 35_000;

export default function AboutScene() {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const splineWrapperRef =
    useRef<HTMLDivElement | null>(null);

  const [isNearViewport, setIsNearViewport] =
    useState(false);

  const [loadedAttempt, setLoadedAttempt] =
    useState<number | null>(null);

  const [imageFailed, setImageFailed] =
    useState(false);

  const { language } =
    useLanguage();

  /*
   * Same fix as RobotScene:
   * don't reference hook return values before the hook runs.
   */
  const {
    mode,
    isMobile,
    sceneAttempt,
    activateImage,
  } = useAdaptiveMobile3D({
    monitorEnabled:
      isNearViewport &&
      loadedAttempt !== null,
  });

  const sceneLoaded =
    mode === "3d" &&
    loadedAttempt === sceneAttempt;

  const imageAlt =
    language === "am"
      ? "የዘመናዊ ቴክኖሎጂ 3D ስርዓት"
      : "Futuristic technology system";

  /*
   * Lazy-load this second 3D scene.
   *
   * The hero gets priority and About only starts
   * preparing when the visitor gets close to it.
   */
  useEffect(() => {
    const element =
      containerRef.current;

    if (!element) {
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const entry = entries[0];

          if (
            !entry?.isIntersecting
          ) {
            return;
          }

          /*
           * This runs from the IntersectionObserver callback,
           * not synchronously inside the effect body.
           */
          setIsNearViewport(true);

          observer.disconnect();
        },
        {
          rootMargin:
            "550px 0px",

          threshold: 0.01,
        },
      );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleSplineLoad =
    useCallback(() => {
      setLoadedAttempt(
        sceneAttempt,
      );
    }, [sceneAttempt]);

  /*
   * Timeout protection.
   */
  useEffect(() => {
    if (
      mode !== "3d" ||
      !isNearViewport ||
      sceneLoaded
    ) {
      return;
    }

    const timeout =
      window.setTimeout(() => {
        activateImage(
          "spline-timeout",
        );
      }, SPLINE_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    activateImage,
    isNearViewport,
    mode,
    sceneAttempt,
    sceneLoaded,
  ]);

  /*
   * WebGL context-loss protection.
   */
  useEffect(() => {
    if (
      mode !== "3d" ||
      !sceneLoaded
    ) {
      return;
    }

    const canvas =
      splineWrapperRef.current?.querySelector(
        "canvas",
      );

    if (!canvas) {
      return;
    }

    function handleContextLoss(
      event: Event,
    ) {
      event.preventDefault();

      activateImage(
        "webgl-context-lost",
      );
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

  /*
   * Phones preload the fallback so an automatic switch
   * can happen without waiting for another download.
   */
  const shouldRenderImage =
    isMobile ||
    mode === "image";

  const showImage =
    mode === "image" ||
    (
      mode === "3d" &&
      !sceneLoaded
    );

  if (mode === "checking") {
    return (
      <div
        ref={containerRef}
        className="relative h-full w-full bg-[#f8f8f4]"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-[#f8f8f4]"
    >
      {/* BACKGROUND GLOW */}

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#dcebd2]/30 blur-[90px]" />

      {/* ============================================
          PERFORMANCE IMAGE
         ============================================ */}

      {shouldRenderImage && (
        <div
          className={`
            absolute
            inset-0
            z-0

            transition-all
            duration-700
            ease-[cubic-bezier(0.22,1,0.36,1)]

            ${
              showImage
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            }
          `}
        >
          {!imageFailed ? (
            <div
              className={`
                relative
                h-full
                w-full

                ${
                  mode === "image"
                    ? "about-fallback-float"
                    : ""
                }
              `}
            >
<Image
  fill
  src={ABOUT_FALLBACK_IMAGE}
  alt={imageAlt}
  loading="eager"
  fetchPriority="high"
  draggable={false}
  sizes="(max-width: 767px) 50vw, (max-width: 1024px) 45vw, 60vw"
  onError={() => {
    setImageFailed(true);
  }}
  className={`
    select-none
    object-contain

    object-[18%_center]
    scale-[1.12]

    sm:object-[40%_center]
    sm:scale-[1.08]

    lg:object-center
    lg:scale-100

    p-[2%]
    sm:p-[3%]
    lg:p-[2%]
  `}
/>
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#426c2b]/10 bg-white/80 font-mono text-xl font-bold text-[#426c2b]">
                &lt;/&gt;
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================
          QUALITY — REAL SPLINE
         ============================================ */}

      {mode === "3d" &&
        isNearViewport && (
          <div
            ref={splineWrapperRef}
            className={`
              absolute
              inset-0
              z-10

              transition-all
              duration-1000
              ease-[cubic-bezier(0.22,1,0.36,1)]

              ${
                sceneLoaded
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-4 scale-[0.98] opacity-0"
              }
            `}
          >
            <Spline
              key={`about-spline-${sceneAttempt}`}
              scene={ABOUT_SCENE_URL}
              onLoad={handleSplineLoad}
              className="h-full w-full"
            />
          </div>
        )}

      <style jsx global>{`
        .about-fallback-float {
          animation:
            about-fallback-float
            6s
            ease-in-out
            infinite;

          transform-origin: 50% 58%;
          will-change: transform;
        }

        @keyframes about-fallback-float {
          0%,
          100% {
            transform:
              translate3d(0, 0, 0)
              scale(1);
          }

          50% {
            transform:
              translate3d(0, -6px, 0)
              scale(1.008);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .about-fallback-float {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}