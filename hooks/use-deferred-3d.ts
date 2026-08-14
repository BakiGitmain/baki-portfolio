"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useExperienceMode } from "@/components/providers/experience-mode-provider";
import { useLoading } from "@/components/providers/loading-provider";

export type SceneFallbackReason =
  | "module-load-failed"
  | "scene-load-failed"
  | "spline-timeout"
  | "webgl-context-lost";

type Deferred3DOptions = {
  enabled?: boolean;
};

type IdleWindow =
  Window &
  typeof globalThis & {
    requestIdleCallback?: (
      callback: () => void,
      options?: {
        timeout: number;
      },
    ) => number;
    cancelIdleCallback?: (
      handle: number,
    ) => void;
  };

type LoadRequest = {
  allowed: boolean;
  id: number;
};

export function useDeferred3D({
  enabled = true,
}: Deferred3DOptions = {}) {
  const {
    mode,
    userSelected,
    setExperienceMode,
  } = useExperienceMode();

  const { hasRevealed } =
    useLoading();

  const [loadRequest, setLoadRequest] =
    useState<LoadRequest>({
      allowed: false,
      id: 0,
    });

  const activateImage =
    useCallback(
      (
        reason: SceneFallbackReason,
      ) => {
        void reason;

        setExperienceMode(
          "performance",
          {
            persist: false,
            source: "session",
          },
        );
      },
      [setExperienceMode],
    );

  /*
   * Default desktop Quality waits until the critical page is
   * visible, then uses the browser's first idle opportunity.
   * An explicit manual Quality selection begins immediately.
   */
  useEffect(() => {
    if (
      !enabled ||
      !hasRevealed ||
      mode !== "quality"
    ) {
      return;
    }

    const idleWindow =
      window as IdleWindow;

    let cancelled = false;
    let idleHandle = 0;
    let timerHandle = 0;

    function beginLoading() {
      if (cancelled) {
        return;
      }

      setLoadRequest(
        (current) => ({
          allowed: true,
          id: current.id + 1,
        }),
      );
    }

    if (userSelected) {
      timerHandle =
        window.setTimeout(
          beginLoading,
          0,
        );
    } else if (
      idleWindow.requestIdleCallback
    ) {
      idleHandle =
        idleWindow.requestIdleCallback(
          beginLoading,
          {
            timeout: 1_000,
          },
        );
    } else {
      timerHandle =
        window.setTimeout(
          beginLoading,
          180,
        );
    }

    return () => {
      cancelled = true;

      if (idleHandle) {
        idleWindow.cancelIdleCallback?.(
          idleHandle,
        );
      }

      if (timerHandle) {
        window.clearTimeout(
          timerHandle,
        );
      }
    };
  }, [
    enabled,
    hasRevealed,
    mode,
    userSelected,
  ]);

  return {
    mode,
    requestId: loadRequest.id,
    shouldLoad3D:
      enabled &&
      hasRevealed &&
      mode === "quality" &&
      loadRequest.allowed,
    activateImage,
  };
}
