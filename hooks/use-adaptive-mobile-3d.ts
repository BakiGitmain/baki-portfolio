"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useExperienceMode } from "@/components/providers/experience-mode-provider";

export type RobotRenderMode =
  | "checking"
  | "3d"
  | "image";

export type RobotFallbackReason =
  | "none"
  | "reduced-motion"
  | "low-memory"
  | "low-cpu"
  | "sustained-lag"
  | "webgl-context-lost"
  | "spline-timeout"
  | "manual";

type AdaptiveMobile3DOptions = {
  monitorEnabled: boolean;
};

type NavigatorWithPerformanceHints =
  Navigator & {
    deviceMemory?: number;

    userAgentData?: {
      mobile?: boolean;
    };
  };

const PERFORMANCE_WARMUP_MS =
  4_500;

const SAMPLE_WINDOW_MS =
  2_500;

const HISTORY_SIZE = 4;

const REQUIRED_BAD_WINDOWS = 3;

const REQUIRED_CONSECUTIVE_BAD_WINDOWS =
  2;

const REQUIRED_CATASTROPHIC_WINDOWS =
  2;

function isPhoneDevice() {
  const extendedNavigator =
    navigator as NavigatorWithPerformanceHints;

  const phoneViewport =
    window.matchMedia(
      "(max-width: 767px)",
    ).matches;

  const coarsePointer =
    window.matchMedia(
      "(pointer: coarse)",
    ).matches;

  const userAgentSaysMobile =
    extendedNavigator
      .userAgentData
      ?.mobile === true;

  const hasTouch =
    navigator.maxTouchPoints > 0;

  return (
    phoneViewport &&
    (
      userAgentSaysMobile ||
      coarsePointer ||
      hasTouch
    )
  );
}

function getInitialFallbackReason():
  | RobotFallbackReason
  | null {
  const extendedNavigator =
    navigator as NavigatorWithPerformanceHints;

  const prefersReducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

  if (prefersReducedMotion) {
    return "reduced-motion";
  }

  const memory =
    extendedNavigator.deviceMemory;

  if (
    typeof memory === "number" &&
    memory <= 2
  ) {
    return "low-memory";
  }

  const logicalProcessors =
    navigator.hardwareConcurrency;

  if (
    typeof logicalProcessors ===
      "number" &&
    logicalProcessors <= 2
  ) {
    return "low-cpu";
  }

  return null;
}

export function useAdaptiveMobile3D({
  monitorEnabled,
}: AdaptiveMobile3DOptions) {
  const {
    mode: experienceMode,
    userSelected,
    setExperienceMode,
  } = useExperienceMode();

  const [
    mode,
    setMode,
  ] =
    useState<RobotRenderMode>(
      "checking",
    );

  const [
    reason,
    setReason,
  ] =
    useState<RobotFallbackReason>(
      "none",
    );

  const [
    isMobile,
    setIsMobile,
  ] =
    useState(false);

  const [
    sceneAttempt,
    setSceneAttempt,
  ] =
    useState(0);

  const initialResolvedRef =
    useRef(false);

  const activateImage =
    useCallback(
      (
        nextReason:
          RobotFallbackReason,
        persist = false,
      ) => {
        setReason(nextReason);

        setMode("image");

        setExperienceMode(
          "performance",
          {
            persist,
          },
        );
      },
      [setExperienceMode],
    );

  const tryInteractive3D =
    useCallback(() => {
      setReason("none");

      setSceneAttempt(
        (current) =>
          current + 1,
      );

      setMode("3d");

      setExperienceMode(
        "quality",
        {
          persist: true,
        },
      );
    }, [
      setExperienceMode,
    ]);

  const useLightweightMode =
    useCallback(() => {
      setReason("manual");

      setMode("image");

      setExperienceMode(
        "performance",
        {
          persist: true,
        },
      );
    }, [
      setExperienceMode,
    ]);

  /*
   * Resolve the global mode + device capability.
   */
  useEffect(() => {
    const frame =
      window.requestAnimationFrame(
        () => {
          const phone =
            isPhoneDevice();

          setIsMobile(phone);

          /*
           * Performance mode ALWAYS wins,
           * including on desktop.
           */
          if (
            experienceMode ===
            "performance"
          ) {
            setReason(
              userSelected
                ? "manual"
                : reason,
            );

            setMode("image");

            initialResolvedRef.current =
              true;

            return;
          }

          /*
           * Explicit Quality selection:
           * give the visitor real 3D.
           */
          if (
            userSelected &&
            experienceMode ===
              "quality"
          ) {
            setReason("none");

            setSceneAttempt(
              (current) =>
                initialResolvedRef.current
                  ? current + 1
                  : current,
            );

            setMode("3d");

            initialResolvedRef.current =
              true;

            return;
          }

          /*
           * Desktop defaults to quality.
           */
          if (!phone) {
            setReason("none");

            setMode("3d");

            initialResolvedRef.current =
              true;

            return;
          }

          /*
           * Automatic mobile preflight.
           */
          const fallbackReason =
            getInitialFallbackReason();

          if (fallbackReason) {
            setReason(
              fallbackReason,
            );

            setMode("image");

            setExperienceMode(
              "performance",
              {
                persist: false,
              },
            );

            initialResolvedRef.current =
              true;

            return;
          }

          setReason("none");

          setMode("3d");

          initialResolvedRef.current =
            true;
        },
      );

    return () => {
      window.cancelAnimationFrame(
        frame,
      );
    };
  }, [
    experienceMode,
    setExperienceMode,
    userSelected,
  ]);

  /*
   * Real sustained performance monitor.
   *
   * It only runs when:
   * - phone
   * - live 3D
   * - scene is active
   * - visitor has NOT explicitly forced Quality
   */
  useEffect(() => {
    if (
      !isMobile ||
      mode !== "3d" ||
      !monitorEnabled ||
      experienceMode !==
        "quality" ||
      userSelected
    ) {
      return;
    }

    let animationFrame = 0;

    let longTaskObserver:
      | PerformanceObserver
      | null = null;

    let previousTimestamp = 0;

    let windowStartedAt = 0;

    let frameCount = 0;

    let slowFrameCount = 0;

    let severeFrameCount = 0;

    let longTaskDuration = 0;

    let consecutiveBadWindows = 0;

    let consecutiveCatastrophicWindows =
      0;

    const badWindowHistory:
      boolean[] = [];

    const warmupEndsAt =
      performance.now() +
      PERFORMANCE_WARMUP_MS;

    function resetWindow(
      timestamp: number,
    ) {
      windowStartedAt =
        timestamp;

      frameCount = 0;

      slowFrameCount = 0;

      severeFrameCount = 0;

      longTaskDuration = 0;
    }

    if (
      typeof PerformanceObserver !==
        "undefined" &&
      PerformanceObserver
        .supportedEntryTypes
        ?.includes("longtask")
    ) {
      longTaskObserver =
        new PerformanceObserver(
          (entryList) => {
            if (
              document
                .visibilityState !==
                "visible" ||
              performance.now() <
                warmupEndsAt
            ) {
              return;
            }

            for (
              const entry of
              entryList.getEntries()
            ) {
              longTaskDuration +=
                entry.duration;
            }
          },
        );

      try {
        longTaskObserver.observe({
          entryTypes: [
            "longtask",
          ],
        });
      } catch {
        longTaskObserver.disconnect();

        longTaskObserver =
          null;
      }
    }

    function measureFrame(
      timestamp: number,
    ) {
      if (
        document.visibilityState !==
        "visible"
      ) {
        previousTimestamp =
          timestamp;

        resetWindow(
          timestamp,
        );

        animationFrame =
          window.requestAnimationFrame(
            measureFrame,
          );

        return;
      }

      if (
        previousTimestamp === 0
      ) {
        previousTimestamp =
          timestamp;

        resetWindow(
          timestamp,
        );

        animationFrame =
          window.requestAnimationFrame(
            measureFrame,
          );

        return;
      }

      const frameDuration =
        timestamp -
        previousTimestamp;

      previousTimestamp =
        timestamp;

      if (
        timestamp <
        warmupEndsAt
      ) {
        resetWindow(
          timestamp,
        );

        animationFrame =
          window.requestAnimationFrame(
            measureFrame,
          );

        return;
      }

      if (
        frameDuration >
        1_000
      ) {
        resetWindow(
          timestamp,
        );

        animationFrame =
          window.requestAnimationFrame(
            measureFrame,
          );

        return;
      }

      frameCount += 1;

      if (
        frameDuration > 34
      ) {
        slowFrameCount += 1;
      }

      if (
        frameDuration > 80
      ) {
        severeFrameCount += 1;
      }

      const windowDuration =
        timestamp -
        windowStartedAt;

      if (
        windowDuration >=
        SAMPLE_WINDOW_MS
      ) {
        const fps =
          (
            frameCount *
            1_000
          ) /
          windowDuration;

        const slowRatio =
          frameCount > 0
            ? slowFrameCount /
              frameCount
            : 1;

        const badWindow =
          fps < 28 ||
          (
            fps < 40 &&
            slowRatio > 0.2
          ) ||
          slowRatio > 0.38 ||
          severeFrameCount >= 3 ||
          longTaskDuration >=
            320;

        const catastrophic =
          fps < 18 ||
          severeFrameCount >= 8 ||
          longTaskDuration >=
            900;

        badWindowHistory.push(
          badWindow,
        );

        if (
          badWindowHistory.length >
          HISTORY_SIZE
        ) {
          badWindowHistory.shift();
        }

        consecutiveBadWindows =
          badWindow
            ? consecutiveBadWindows +
              1
            : 0;

        consecutiveCatastrophicWindows =
          catastrophic
            ? consecutiveCatastrophicWindows +
              1
            : 0;

        const badWindows =
          badWindowHistory.filter(
            Boolean,
          ).length;

        const sustained =
          badWindowHistory.length ===
            HISTORY_SIZE &&
          badWindows >=
            REQUIRED_BAD_WINDOWS &&
          consecutiveBadWindows >=
            REQUIRED_CONSECUTIVE_BAD_WINDOWS;

        const catastrophicFailure =
          consecutiveCatastrophicWindows >=
          REQUIRED_CATASTROPHIC_WINDOWS;

        if (
          sustained ||
          catastrophicFailure
        ) {
          activateImage(
            "sustained-lag",
            false,
          );

          return;
        }

        resetWindow(
          timestamp,
        );
      }

      animationFrame =
        window.requestAnimationFrame(
          measureFrame,
        );
    }

    animationFrame =
      window.requestAnimationFrame(
        measureFrame,
      );

    return () => {
      window.cancelAnimationFrame(
        animationFrame,
      );

      longTaskObserver?.disconnect();
    };
  }, [
    activateImage,
    experienceMode,
    isMobile,
    mode,
    monitorEnabled,
    sceneAttempt,
    userSelected,
  ]);

  return {
    mode,
    reason,
    isMobile,
    sceneAttempt,
    activateImage,
    tryInteractive3D,
    useLightweightMode,
  };
}