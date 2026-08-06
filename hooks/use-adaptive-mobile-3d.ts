"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

export type RobotRenderMode =
  | "checking"
  | "3d"
  | "image";

export type RobotFallbackReason =
  | "none"
  | "remembered"
  | "reduced-motion"
  | "low-memory"
  | "low-cpu"
  | "sustained-lag"
  | "webgl-context-lost"
  | "spline-timeout"
  | "manual";

type AdaptiveMobile3DOptions = {
  /**
   * Start measuring only after:
   * - Spline has loaded
   * - the main website has been revealed
   */
  monitorEnabled: boolean;
};

type NavigatorWithPerformanceHints = Navigator & {
  deviceMemory?: number;

  userAgentData?: {
    mobile?: boolean;
  };
};

const SESSION_STORAGE_KEY =
  "baki-portfolio-robot-render-mode";

/**
 * Give WebGL time to compile shaders, initialize textures,
 * and finish the loader/page transition.
 */
const PERFORMANCE_WARMUP_MS = 4_500;

/**
 * Each measurement window lasts 2.5 seconds.
 *
 * Four windows means the system observes roughly ten seconds
 * before making a normal performance fallback decision.
 */
const SAMPLE_WINDOW_MS = 2_500;
const HISTORY_SIZE = 4;
const REQUIRED_BAD_WINDOWS = 3;
const REQUIRED_CONSECUTIVE_BAD_WINDOWS = 2;

/**
 * Two extremely bad windows can trigger an earlier fallback.
 * This still requires about five seconds of severely bad rendering.
 */
const REQUIRED_CATASTROPHIC_WINDOWS = 2;

function isPhoneDevice() {
  const extendedNavigator =
    navigator as NavigatorWithPerformanceHints;

  const phoneViewport = window.matchMedia(
    "(max-width: 767px)",
  ).matches;

  const coarsePointer = window.matchMedia(
    "(pointer: coarse)",
  ).matches;

  const userAgentSaysMobile =
    extendedNavigator.userAgentData?.mobile === true;

  const hasTouch =
    navigator.maxTouchPoints > 0;

  /*
   * Requiring a phone-sized viewport prevents small desktop
   * browser windows from being classified as phones.
   */
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

  const rememberedMode = window.sessionStorage.getItem(
    SESSION_STORAGE_KEY,
  );

  if (rememberedMode === "image") {
    return "remembered";
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReducedMotion) {
    return "reduced-motion";
  }

  /*
   * These thresholds are intentionally conservative.
   * Borderline phones still get a chance to run the real scene,
   * after which actual frame performance decides.
   */
  const memory = extendedNavigator.deviceMemory;

  if (
    typeof memory === "number" &&
    memory <= 2
  ) {
    return "low-memory";
  }

  const logicalProcessors =
    navigator.hardwareConcurrency;

  if (
    typeof logicalProcessors === "number" &&
    logicalProcessors <= 2
  ) {
    return "low-cpu";
  }

  return null;
}

export function useAdaptiveMobile3D({
  monitorEnabled,
}: AdaptiveMobile3DOptions) {
  const [mode, setMode] =
    useState<RobotRenderMode>("checking");

  const [reason, setReason] =
    useState<RobotFallbackReason>("none");

  const [isMobile, setIsMobile] =
    useState(false);

  const [sceneAttempt, setSceneAttempt] =
    useState(0);

  const activateImage = useCallback(
    (
      nextReason: RobotFallbackReason,
      remember = true,
    ) => {
      if (remember) {
        window.sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          "image",
        );
      }

      setReason(nextReason);
      setMode("image");
    },
    [],
  );

  const tryInteractive3D = useCallback(() => {
    window.sessionStorage.removeItem(
      SESSION_STORAGE_KEY,
    );

    setReason("none");
    setSceneAttempt((current) => current + 1);
    setMode("3d");
  }, []);

  const useLightweightMode = useCallback(() => {
    activateImage("manual");
  }, [activateImage]);

  /*
   * Resolve browser-only device information after hydration.
   * requestAnimationFrame keeps the state update outside the
   * synchronous effect body.
   */
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const phone = isPhoneDevice();

      setIsMobile(phone);

      if (!phone) {
        setReason("none");
        setMode("3d");
        return;
      }

      const initialFallback =
        getInitialFallbackReason();

      if (initialFallback) {
        activateImage(initialFallback);
        return;
      }

      setReason("none");
      setMode("3d");
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [activateImage]);

  /*
   * Actual sustained-performance monitor.
   *
   * This only runs on phone-sized devices while the live 3D scene
   * is mounted, loaded, and visible to the visitor.
   */
  useEffect(() => {
    if (
      !isMobile ||
      mode !== "3d" ||
      !monitorEnabled
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
    let consecutiveCatastrophicWindows = 0;

    const badWindowHistory: boolean[] = [];

    const warmupEndsAt =
      performance.now() + PERFORMANCE_WARMUP_MS;

    function resetMeasurementWindow(
      timestamp: number,
    ) {
      windowStartedAt = timestamp;

      frameCount = 0;
      slowFrameCount = 0;
      severeFrameCount = 0;
      longTaskDuration = 0;
    }

    /*
     * Long Tasks are supplementary.
     * Safari or another browser may not expose "longtask",
     * so the feature is detected before observing it.
     */
    if (
      typeof PerformanceObserver !== "undefined" &&
      PerformanceObserver.supportedEntryTypes?.includes(
        "longtask",
      )
    ) {
      longTaskObserver = new PerformanceObserver(
        (entryList) => {
          if (
            document.visibilityState !== "visible" ||
            performance.now() < warmupEndsAt
          ) {
            return;
          }

          for (const entry of entryList.getEntries()) {
            longTaskDuration += entry.duration;
          }
        },
      );

      try {
        longTaskObserver.observe({
          entryTypes: ["longtask"],
        });
      } catch {
        longTaskObserver.disconnect();
        longTaskObserver = null;
      }
    }

    function measureFrame(timestamp: number) {
      /*
       * requestAnimationFrame is heavily throttled in background
       * tabs. Those samples must never classify the device as slow.
       */
      if (
        document.visibilityState !== "visible"
      ) {
        previousTimestamp = timestamp;
        resetMeasurementWindow(timestamp);

        animationFrame =
          window.requestAnimationFrame(measureFrame);

        return;
      }

      if (previousTimestamp === 0) {
        previousTimestamp = timestamp;
        resetMeasurementWindow(timestamp);

        animationFrame =
          window.requestAnimationFrame(measureFrame);

        return;
      }

      const frameDuration =
        timestamp - previousTimestamp;

      previousTimestamp = timestamp;

      /*
       * Ignore initialization and loader-exit activity.
       */
      if (timestamp < warmupEndsAt) {
        resetMeasurementWindow(timestamp);

        animationFrame =
          window.requestAnimationFrame(measureFrame);

        return;
      }

      /*
       * Ignore a giant interval caused by tab switching,
       * browser UI interruption, or device sleep.
       */
      if (frameDuration > 1_000) {
        resetMeasurementWindow(timestamp);

        animationFrame =
          window.requestAnimationFrame(measureFrame);

        return;
      }

      frameCount += 1;

      /*
       * Above 34 ms means the browser missed roughly two
       * frames on a 60 Hz display.
       */
      if (frameDuration > 34) {
        slowFrameCount += 1;
      }

      /*
       * Above 80 ms is clearly visible as a stutter.
       */
      if (frameDuration > 80) {
        severeFrameCount += 1;
      }

      const windowDuration =
        timestamp - windowStartedAt;

      if (windowDuration >= SAMPLE_WINDOW_MS) {
        const framesPerSecond =
          (frameCount * 1_000) / windowDuration;

        const slowFrameRatio =
          frameCount > 0
            ? slowFrameCount / frameCount
            : 1;

        const badWindow =
          framesPerSecond < 28 ||
          (
            framesPerSecond < 40 &&
            slowFrameRatio > 0.2
          ) ||
          slowFrameRatio > 0.38 ||
          severeFrameCount >= 3 ||
          longTaskDuration >= 320;

        const catastrophicWindow =
          framesPerSecond < 18 ||
          severeFrameCount >= 8 ||
          longTaskDuration >= 900;

        badWindowHistory.push(badWindow);

        if (
          badWindowHistory.length >
          HISTORY_SIZE
        ) {
          badWindowHistory.shift();
        }

        consecutiveBadWindows = badWindow
          ? consecutiveBadWindows + 1
          : 0;

        consecutiveCatastrophicWindows =
          catastrophicWindow
            ? consecutiveCatastrophicWindows + 1
            : 0;

        const badWindowsInHistory =
          badWindowHistory.filter(Boolean).length;

        const sustainedPoorPerformance =
          badWindowHistory.length ===
            HISTORY_SIZE &&
          badWindowsInHistory >=
            REQUIRED_BAD_WINDOWS &&
          consecutiveBadWindows >=
            REQUIRED_CONSECUTIVE_BAD_WINDOWS;

        const catastrophicPerformance =
          consecutiveCatastrophicWindows >=
          REQUIRED_CATASTROPHIC_WINDOWS;

        if (
          sustainedPoorPerformance ||
          catastrophicPerformance
        ) {
          activateImage("sustained-lag");

          return;
        }

        resetMeasurementWindow(timestamp);
      }

      animationFrame =
        window.requestAnimationFrame(measureFrame);
    }

    animationFrame =
      window.requestAnimationFrame(measureFrame);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      longTaskObserver?.disconnect();
    };
  }, [
    activateImage,
    isMobile,
    mode,
    monitorEnabled,
    sceneAttempt,
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