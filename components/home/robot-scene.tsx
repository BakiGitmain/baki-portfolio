"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { Application } from "@splinetool/runtime";

import { useLoading } from "@/components/providers/loading-provider";

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

const SPLINE_TIMEOUT = 45000;

export default function RobotScene() {
  const {
    completeTask,
    failTask,
    hasRevealed,
  } = useLoading();

  const sceneLoadedRef = useRef(false);
  const splineApplicationRef = useRef<Application | null>(null);

  const handleSplineLoad = useCallback(
    (application: Application) => {
      sceneLoadedRef.current = true;
      splineApplicationRef.current = application;

      completeTask("scene3d");
    },
    [completeTask],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!sceneLoadedRef.current) {
        failTask("scene3d");
      }
    }, SPLINE_TIMEOUT);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [failTask]);

  return (
    <div
      className={`spline-shell absolute inset-0 overflow-hidden ${
        hasRevealed
          ? "spline-shell--revealed"
          : "spline-shell--waiting"
      }`}
    >
      <div className="absolute inset-0 scale-[1.12] sm:scale-[1.08] lg:translate-x-[4%] lg:scale-[1.18]">
        <Spline
          scene={SPLINE_SCENE_URL}
          onLoad={handleSplineLoad}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}