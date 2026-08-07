"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useLoading } from "@/components/providers/loading-provider";
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

const SPLINE_SCENE_URL =
  "https://prod.spline.design/Mi2blRidcGffVQCF/scene.splinecode";

const FALLBACK_IMAGE_URL =
  "/images/robot-mobile-fallback.png";

const SPLINE_TIMEOUT_MS = 45_000;

export default function RobotScene() {
  const wrapperRef =
    useRef<HTMLDivElement | null>(null);

  /*
   * Stores which Spline render attempt actually completed.
   * This avoids calling setSceneLoaded(false) inside an effect.
   */
  const [loadedAttempt, setLoadedAttempt] =
    useState<number | null>(null);

  const [posterLoaded, setPosterLoaded] =
    useState(false);

  const [posterFailed, setPosterFailed] =
    useState(false);

  const {
    completeTask,
    failTask,
    hasRevealed,
  } = useLoading();

  /*
   * IMPORTANT:
   * We cannot use "mode" or "sceneAttempt" here because
   * those values are returned BY this hook.
   *
   * The adaptive hook already checks whether mode === "3d",
   * so this signal only needs to tell it whether a scene has
   * successfully loaded and the website has been revealed.
   */
  const {
    mode,
    isMobile,
    sceneAttempt,
    activateImage,
  } = useAdaptiveMobile3D({
    monitorEnabled:
      loadedAttempt !== null &&
      hasRevealed,
  });

  /*
   * loadedAttempt must match the current attempt.
   *
   * Example:
   *
   * attempt 0 loads:
   * loadedAttempt = 0
   *
   * Quality mode remounts Spline:
   * sceneAttempt = 1
   * loadedAttempt = 0
   *
   * sceneLoaded automatically becomes false.
   *
   * No reset effect needed.
   */
  const sceneLoaded =
    mode === "3d" &&
    loadedAttempt === sceneAttempt;

  const handleSplineLoad =
    useCallback(() => {
      setLoadedAttempt(sceneAttempt);

      completeTask("scene3d");
    }, [
      completeTask,
      sceneAttempt,
    ]);

  /*
   * PERFORMANCE MODE
   *
   * The real fallback image must load before we consider
   * the hero's 3D loading task resolved.
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
   * If Spline takes too long, switch to the image.
   */
  useEffect(() => {
    if (
      mode !== "3d" ||
      sceneLoaded
    ) {
      return;
    }

    const timeout =
      window.setTimeout(() => {
        failTask("scene3d");

        activateImage(
          "spline-timeout",
        );
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
   * If WebGL crashes or the GPU context gets lost,
   * immediately switch to Performance mode.
   */
  useEffect(() => {
    if (
      mode !== "3d" ||
      !sceneLoaded
    ) {
      return;
    }

    const canvas =
      wrapperRef.current?.querySelector(
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
   * Preload the fallback image on phones.
   *
   * This makes an automatic 3D -> image transition
   * basically instant if the phone starts struggling.
   */
  const shouldRenderPoster =
    isMobile ||
    mode === "image";

  const posterVisible =
    mode === "image" ||
    (
      mode === "3d" &&
      (
        !sceneLoaded ||
        !hasRevealed
      )
    );

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
      {/* ============================================
          PERFORMANCE MODE IMAGE
         ============================================ */}

      {shouldRenderPoster && (
        <div
          className={`
            absolute
            inset-0
            z-0

            transition-all
            duration-700
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
                relative
                h-full
                w-full

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
                alt="Baki AI robot"
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
                className={`
                  translate-y-[3%]
                  scale-[1.13]

                  select-none
                  object-contain
                  object-center
                `}
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border border-[#4b702f]/15 bg-white/70 font-mono text-2xl font-bold text-[#4b702f] shadow-sm">
                &lt;/&gt;
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================
          QUALITY MODE — REAL SPLINE
         ============================================ */}

      {mode === "3d" && (
        <div
          ref={wrapperRef}
          className={`
            spline-shell
            absolute
            inset-0
            z-10
            overflow-hidden

            ${
              sceneLoaded &&
              hasRevealed
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