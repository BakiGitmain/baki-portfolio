"use client";

import Spline from "@splinetool/react-spline";
import type { Application } from "@splinetool/runtime";
import {
  useCallback,
  useEffect,
  useRef,
} from "react";

export type DeferredSplineCanvasProps = {
  scene: string;
  active: boolean;
  onReady: () => void;
  className?: string;
};

export default function DeferredSplineCanvas({
  scene,
  active,
  onReady,
  className,
}: DeferredSplineCanvasProps) {
  const applicationRef =
    useRef<Application | null>(null);

  const handleLoad =
    useCallback(
      (application: Application) => {
        applicationRef.current =
          application;

        if (!active) {
          application.stop();
        }

        onReady();
      },
      [active, onReady],
    );

  useEffect(() => {
    const application =
      applicationRef.current;

    if (!application) {
      return;
    }

    if (active) {
      application.play();
    } else {
      application.stop();
    }
  }, [active]);

  return (
    <Spline
      scene={scene}
      onLoad={handleLoad}
      renderOnDemand
      className={className}
    />
  );
}
