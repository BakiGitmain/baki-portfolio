"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";

import SplineErrorBoundary from "@/components/home/spline-error-boundary";
import type { DeferredSplineCanvasProps } from "@/components/home/spline-canvas";
import { useLoading } from "@/components/providers/loading-provider";
import { useDeferred3D } from "@/hooks/use-deferred-3d";

const SPLINE_SCENE_URL =
  "https://prod.spline.design/Mi2blRidcGffVQCF/scene.splinecode";

const FALLBACK_IMAGE_URL =
  "/images/robot-mobile-fallback.webp";

const SPLINE_TIMEOUT_MS = 30_000;

export default function RobotScene() {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const splineWrapperRef =
    useRef<HTMLDivElement | null>(null);

  const [isHeroVisible, setIsHeroVisible] =
    useState(true);

  const [loadedRequest, setLoadedRequest] =
    useState<number | null>(null);

  const [posterFailed, setPosterFailed] =
    useState(false);

  const [SplineCanvas, setSplineCanvas] =
    useState<ComponentType<DeferredSplineCanvasProps> | null>(
      null,
    );

  const { markHeroReady } =
    useLoading();

  const {
    mode,
    requestId,
    shouldLoad3D,
    activateImage,
  } = useDeferred3D();

  const sceneLoaded =
    shouldLoad3D &&
    SplineCanvas !== null &&
    loadedRequest === requestId;

  useEffect(() => {
    const element =
      containerRef.current;

    if (
      !element ||
      typeof IntersectionObserver ===
        "undefined"
    ) {
      return;
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          setIsHeroVisible(
            entry?.isIntersecting ??
              true,
          );
        },
        {
          rootMargin: "160px 0px",
          threshold: 0.01,
        },
      );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  /*
   * This import is the true 3D boundary. It is never executed
   * on default mobile/Performance mode and only runs after the
   * deferred hook grants permission.
   */
  useEffect(() => {
    if (
      !shouldLoad3D ||
      SplineCanvas
    ) {
      return;
    }

    let cancelled = false;

    void import(
      "@/components/home/spline-canvas"
    )
      .then((module) => {
        if (!cancelled) {
          setSplineCanvas(
            () => module.default,
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          activateImage(
            "module-load-failed",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    SplineCanvas,
    activateImage,
    shouldLoad3D,
  ]);

  const handleSplineReady =
    useCallback(() => {
      setLoadedRequest(
        requestId,
      );
    }, [requestId]);

  const handleSplineError =
    useCallback(() => {
      activateImage(
        "scene-load-failed",
      );
    }, [activateImage]);

  useEffect(() => {
    if (
      !shouldLoad3D ||
      !SplineCanvas ||
      sceneLoaded
    ) {
      return;
    }

    const timeout =
      window.setTimeout(
        () => {
          activateImage(
            "spline-timeout",
          );
        },
        SPLINE_TIMEOUT_MS,
      );

    return () => {
      window.clearTimeout(
        timeout,
      );
    };
  }, [
    SplineCanvas,
    activateImage,
    requestId,
    sceneLoaded,
    shouldLoad3D,
  ]);

  useEffect(() => {
    if (!sceneLoaded) {
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
    sceneLoaded,
  ]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      data-3d-mode={mode}
      data-3d-state={
        sceneLoaded
          ? "ready"
          : shouldLoad3D
            ? "loading"
            : "idle"
      }
    >
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-500 ease-out ${
          sceneLoaded
            ? "pointer-events-none opacity-0"
            : "opacity-100"
        }`}
      >
        {!posterFailed ? (
          <div
            className={`relative h-full w-full ${
              mode === "quality"
                ? "robot-mobile-poster-float"
                : ""
            }`}
          >
            <Image
              fill
              preload
              src={FALLBACK_IMAGE_URL}
              alt="Baki AI robot"
              sizes="(max-width: 1023px) 100vw, 50vw"
              draggable={false}
              onLoad={markHeroReady}
              onError={() => {
                setPosterFailed(true);
                markHeroReady();
              }}
              className="translate-y-[3%] scale-[1.13] select-none object-contain object-center"
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

      {shouldLoad3D &&
        SplineCanvas && (
          <div
            ref={splineWrapperRef}
            className={`spline-shell absolute inset-0 z-10 overflow-hidden ${
              sceneLoaded
                ? "spline-shell--revealed"
                : "spline-shell--waiting"
            }`}
          >
            <div className="absolute inset-0 scale-[1.12] sm:scale-[1.08] lg:translate-x-[4%] lg:scale-[1.18]">
              <SplineErrorBoundary
                key={`robot-boundary-${requestId}`}
                onError={handleSplineError}
              >
                <SplineCanvas
                  key={`robot-scene-${requestId}`}
                  scene={SPLINE_SCENE_URL}
                  active={isHeroVisible}
                  onReady={handleSplineReady}
                  className="h-full w-full"
                />
              </SplineErrorBoundary>
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
