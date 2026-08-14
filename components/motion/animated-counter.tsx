"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useInView,
} from "motion/react";

import {
  usePortfolioMotion,
} from "@/components/motion/motion-provider";

type ParsedCounter = {
  decimals: number;
  number: number;
  prefix: string;
  suffix: string;
};

function parseCounter(
  value: string,
): ParsedCounter | null {
  const match =
    value.match(
      /^([^\d]*)(\d+(?:\.\d+)?)(.*)$/u,
    );

  if (!match) {
    return null;
  }

  const number =
    Number(
      match[2],
    );

  if (!Number.isFinite(number)) {
    return null;
  }

  return {
    decimals:
      match[2].split(
        ".",
      )[1]?.length ?? 0,
    number,
    prefix:
      match[1],
    suffix:
      match[3],
  };
}

export default function AnimatedCounter({
  active = true,
  value,
}: {
  active?: boolean;
  value: string;
}) {
  const ref =
    useRef<HTMLSpanElement | null>(
      null,
    );

  const inView =
    useInView(
      ref,
      {
        amount: 0.7,
        once: true,
      },
    );

  const {
    intensity,
    reducedMotion,
  } = usePortfolioMotion();

  const parsed =
    useMemo(
      () =>
        parseCounter(
          value,
        ),
      [value],
    );

  const [display, setDisplay] =
    useState(value);

  useEffect(() => {
    const counter =
      parsed;

    if (
      !active ||
      !inView ||
      !counter ||
      reducedMotion
    ) {
      return;
    }

    const safeCounter =
      counter;

    let frame = 0;

    const duration =
      intensity ===
      "minimal"
        ? 650
        : 850;

    const startedAt =
      window.performance.now();

    function update(
      now: number,
    ) {
      const progress =
        Math.min(
          1,
          (
            now -
            startedAt
          ) /
            duration,
        );

      const eased =
        1 -
        Math.pow(
          1 - progress,
          3,
        );

      const next =
        safeCounter.number *
        eased;

      setDisplay(
        `${safeCounter.prefix}${next.toFixed(safeCounter.decimals)}${safeCounter.suffix}`,
      );

      if (
        progress < 1
      ) {
        frame =
          window.requestAnimationFrame(
            update,
          );
      } else {
        setDisplay(value);
      }
    }

    frame =
      window.requestAnimationFrame(
        update,
      );

    return () => {
      window.cancelAnimationFrame(
        frame,
      );
    };
  }, [
    active,
    inView,
    intensity,
    parsed,
    reducedMotion,
    value,
  ]);

  return (
    <span
      ref={ref}
      aria-label={value}
    >
      {
        !active ||
        !inView ||
        !parsed ||
        reducedMotion
          ? value
          : display
      }
    </span>
  );
}
