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
import { useLanguage } from "@/components/providers/language-provider";
import { useDeferred3D } from "@/hooks/use-deferred-3d";

const ABOUT_SCENE_URL =
  "https://prod.spline.design/zeXjgYQeqkfNnKAM/scene.splinecode";

const ABOUT_FALLBACK_IMAGE =
  "/images/about-3d-fallback.webp";

const SPLINE_TIMEOUT_MS = 25_000;

export default function AboutScene() {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const splineWrapperRef =
    useRef<HTMLDivElement | null>(null);

  const [isNearViewport, setIsNearViewport] =
    useState(false);

  const [isSceneActive, setIsSceneActive] =
    useState(false);

  const [loadedRequest, setLoadedRequest] =
    useState<number | null>(null);

  const [imageFailed, setImageFailed] =
    useState(false);

  const [SplineCanvas, setSplineCanvas] =
    useState<ComponentType<DeferredSplineCanvasProps> | null>(
      null,
    );

  const { language } =
    useLanguage();

  const {
    mode,
    requestId,
    shouldLoad3D,
    activateImage,
  } = useDeferred3D({
    enabled: isNearViewport,
  });

  const sceneLoaded =
    shouldLoad3D &&
    SplineCanvas !== null &&
    loadedRequest === requestId;

  const imageAlt =
    language === "am"
      ? "የዘመናዊ ቴክኖሎጂ 3D ስርዓት"
      : "Futuristic technology system";

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
          const isIntersecting =
            entry?.isIntersecting ??
            false;

          setIsSceneActive(
            isIntersecting,
          );

          if (isIntersecting) {
            setIsNearViewport(true);
          }
        },
        {
          rootMargin: "120px 0px",
          threshold: 0.01,
        },
      );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

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
      className="relative h-full w-full overflow-hidden bg-[#f8f8f4]"
      data-3d-mode={mode}
      data-3d-state={
        sceneLoaded
          ? "ready"
          : shouldLoad3D
            ? "loading"
            : "idle"
      }
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#dcebd2]/30 blur-[90px]" />

      <div
        className={`absolute inset-0 z-0 transition-opacity duration-500 ease-out ${
          sceneLoaded
            ? "pointer-events-none opacity-0"
            : "opacity-100"
        }`}
      >
        {!imageFailed ? (
          <div
            className={`relative h-full w-full ${
              mode === "quality"
                ? "about-fallback-float"
                : ""
            }`}
          >
            <Image
              fill
              src={ABOUT_FALLBACK_IMAGE}
              alt={imageAlt}
              sizes="(max-width: 1023px) 76vw, 50vw"
              draggable={false}
              onError={() => {
                setImageFailed(true);
              }}
              className="select-none object-contain object-[18%_center] scale-[1.12] p-[2%] sm:object-[40%_center] sm:scale-[1.08] sm:p-[3%] lg:object-center lg:scale-100 lg:p-[2%]"
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

      {shouldLoad3D &&
        SplineCanvas && (
          <div
            ref={splineWrapperRef}
            className={`spline-shell absolute inset-0 z-10 ${
              sceneLoaded
                ? "spline-shell--revealed"
                : "spline-shell--waiting"
            }`}
          >
            <SplineErrorBoundary
              key={`about-boundary-${requestId}`}
              onError={handleSplineError}
            >
              <SplineCanvas
                key={`about-scene-${requestId}`}
                scene={ABOUT_SCENE_URL}
                active={isSceneActive}
                onReady={handleSplineReady}
                className="h-full w-full"
              />
            </SplineErrorBoundary>
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
