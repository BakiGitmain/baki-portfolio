"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  LazyMotion,
  MotionConfig,
  useReducedMotion,
} from "motion/react";

import {
  useExperienceMode,
} from "@/components/providers/experience-mode-provider";

import {
  PREMIUM_EASE,
} from "@/components/motion/motion-config";

type MotionIntensity =
  | "minimal"
  | "premium";

type PortfolioMotionContextValue = {
  finePointer: boolean;
  heroHasPlayed: boolean;
  intensity: MotionIntensity;
  isPremium: boolean;
  reducedMotion: boolean;
  markHeroPlayed: () => void;
};

const PortfolioMotionContext =
  createContext<PortfolioMotionContextValue | null>(
    null,
  );

const loadMotionFeatures = () =>
  import(
    "@/components/motion/motion-features"
  ).then(
    (module) => module.default,
  );

export default function PortfolioMotionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const {
    mode,
  } = useExperienceMode();

  const prefersReducedMotion =
    useReducedMotion();

  const [finePointer, setFinePointer] =
    useState(false);

  const [heroHasPlayed, setHeroHasPlayed] =
    useState(false);

  useEffect(() => {
    const query =
      window.matchMedia(
        "(hover: hover) and (pointer: fine)",
      );

    function updatePointer() {
      setFinePointer(
        query.matches,
      );
    }

    updatePointer();

    query.addEventListener(
      "change",
      updatePointer,
    );

    return () => {
      query.removeEventListener(
        "change",
        updatePointer,
      );
    };
  }, []);

  const reducedMotion =
    prefersReducedMotion === true;

  const isPremium =
    mode === "quality" &&
    !reducedMotion;

  const markHeroPlayed =
    useCallback(() => {
      setHeroHasPlayed(true);
    }, []);

  const value =
    useMemo<PortfolioMotionContextValue>(
      () => ({
        finePointer,
        heroHasPlayed,
        intensity:
          isPremium
            ? "premium"
            : "minimal",
        isPremium,
        reducedMotion,
        markHeroPlayed,
      }),
      [
        finePointer,
        heroHasPlayed,
        isPremium,
        markHeroPlayed,
        reducedMotion,
      ],
    );

  return (
    <PortfolioMotionContext.Provider
      value={value}
    >
      <LazyMotion
        features={loadMotionFeatures}
        strict
      >
        <MotionConfig
          reducedMotion="user"
          transition={{
            duration: 0.56,
            ease: PREMIUM_EASE,
          }}
        >
          {children}
        </MotionConfig>
      </LazyMotion>
    </PortfolioMotionContext.Provider>
  );
}

export function usePortfolioMotion() {
  const context =
    useContext(
      PortfolioMotionContext,
    );

  if (!context) {
    throw new Error(
      "usePortfolioMotion must be used inside PortfolioMotionProvider.",
    );
  }

  return context;
}
