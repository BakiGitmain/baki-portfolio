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

import { usePathname } from "next/navigation";

type LoadingContextValue = {
  initialReady: boolean;
  hasRevealed: boolean;
  markHeroReady: () => void;
  revealExperience: () => void;
};

const CRITICAL_READY_TIMEOUT_MS =
  2_500;

const LoadingContext =
  createContext<LoadingContextValue | null>(
    null,
  );

export default function LoadingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname =
    usePathname();

  const [interfaceReady, setInterfaceReady] =
    useState(false);

  const [heroReady, setHeroReady] =
    useState(
      pathname !== "/",
    );

  const [hasRevealed, setHasRevealed] =
    useState(false);

  const markHeroReady =
    useCallback(() => {
      setHeroReady(true);
    }, []);

  const revealExperience =
    useCallback(() => {
      setHasRevealed(true);
    }, []);

  /*
   * One painted React frame is the only interface gate.
   * Fonts, below-the-fold images and 3D are deliberately
   * excluded from critical readiness.
   */
  useEffect(() => {
    const frame =
      window.requestAnimationFrame(
        () => {
          setInterfaceReady(true);
        },
      );

    return () => {
      window.cancelAnimationFrame(
        frame,
      );
    };
  }, []);

  useEffect(() => {
    if (pathname !== "/") {
      const frame =
        window.requestAnimationFrame(
          markHeroReady,
        );

      return () => {
        window.cancelAnimationFrame(
          frame,
        );
      };
    }
  }, [
    markHeroReady,
    pathname,
  ]);

  /*
   * Never strand the site behind the overlay if the hero
   * image fails or an unusual browser delays its load event.
   */
  useEffect(() => {
    if (
      hasRevealed ||
      (
        interfaceReady &&
        heroReady
      )
    ) {
      return;
    }

    const timeout =
      window.setTimeout(
        () => {
          setInterfaceReady(true);
          setHeroReady(true);
        },
        CRITICAL_READY_TIMEOUT_MS,
      );

    return () => {
      window.clearTimeout(
        timeout,
      );
    };
  }, [
    hasRevealed,
    heroReady,
    interfaceReady,
  ]);

  const initialReady =
    interfaceReady &&
    heroReady;

  const value =
    useMemo<LoadingContextValue>(
      () => ({
        initialReady,
        hasRevealed,
        markHeroReady,
        revealExperience,
      }),
      [
        hasRevealed,
        initialReady,
        markHeroReady,
        revealExperience,
      ],
    );

  return (
    <LoadingContext.Provider
      value={value}
    >
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context =
    useContext(
      LoadingContext,
    );

  if (!context) {
    throw new Error(
      "useLoading must be used inside LoadingProvider.",
    );
  }

  return context;
}
