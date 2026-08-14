"use client";

import {
  m,
  type HTMLMotionProps,
  type Variants,
} from "motion/react";

import {
  MOTION_TIMING,
  PREMIUM_EASE,
  VIEWPORT_ONCE,
} from "@/components/motion/motion-config";

import {
  usePortfolioMotion,
} from "@/components/motion/motion-provider";

type RevealDirection =
  | "down"
  | "left"
  | "none"
  | "right"
  | "up";

type RevealProps =
  HTMLMotionProps<"div"> & {
    delay?: number;
    direction?: RevealDirection;
    distance?: number;
  };

function getOffset(
  direction: RevealDirection,
  distance: number,
) {
  switch (direction) {
    case "down":
      return {
        x: 0,
        y: -distance,
      };

    case "left":
      return {
        x: distance,
        y: 0,
      };

    case "right":
      return {
        x: -distance,
        y: 0,
      };

    case "none":
      return {
        x: 0,
        y: 0,
      };

    default:
      return {
        x: 0,
        y: distance,
      };
  }
}

export function Reveal({
  children,
  delay = 0,
  direction = "up",
  distance = 24,
  ...props
}: RevealProps) {
  const {
    intensity,
    reducedMotion,
  } = usePortfolioMotion();

  const movement =
    reducedMotion
      ? 0
      : intensity ===
          "minimal"
        ? Math.min(
            distance,
            10,
          )
        : distance;

  const offset =
    getOffset(
      direction,
      movement,
    );

  return (
    <m.div
      initial={{
        opacity: 0,
        ...offset,
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      viewport={VIEWPORT_ONCE}
      transition={{
        delay,
        duration:
          intensity ===
          "minimal"
            ? 0.42
            : MOTION_TIMING.standard,
        ease: PREMIUM_EASE,
      }}
      {...props}
    >
      {children}
    </m.div>
  );
}

type StaggerGroupProps =
  HTMLMotionProps<"div"> & {
    delay?: number;
    stagger?: number;
  };

export function StaggerGroup({
  children,
  delay = 0,
  stagger,
  ...props
}: StaggerGroupProps) {
  const {
    intensity,
  } = usePortfolioMotion();

  const variants: Variants = {
    hidden: {},
    visible: {
      transition: {
        delayChildren: delay,
        staggerChildren:
          stagger ??
          (
            intensity ===
            "minimal"
              ? 0.055
              : MOTION_TIMING.itemStagger
          ),
      },
    },
  };

  return (
    <m.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      variants={variants}
      {...props}
    >
      {children}
    </m.div>
  );
}

type StaggerItemProps =
  HTMLMotionProps<"div"> & {
    distance?: number;
  };

export function StaggerItem({
  children,
  distance = 24,
  ...props
}: StaggerItemProps) {
  const {
    intensity,
    reducedMotion,
  } = usePortfolioMotion();

  const movement =
    reducedMotion
      ? 0
      : intensity ===
          "minimal"
        ? Math.min(
            distance,
            10,
          )
        : distance;

  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: movement,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration:
          intensity ===
          "minimal"
            ? 0.4
            : MOTION_TIMING.standard,
        ease: PREMIUM_EASE,
      },
    },
  };

  return (
    <m.div
      variants={variants}
      {...props}
    >
      {children}
    </m.div>
  );
}

export function EyebrowAccent({
  className,
  shape = "line",
}: {
  className?: string;
  shape?:
    | "dot"
    | "line";
}) {
  return (
    <m.span
      aria-hidden="true"
      className={className}
      initial={
        shape === "dot"
          ? {
              opacity: 0,
              scale: 0.4,
            }
          : {
              opacity: 0,
              scaleX: 0,
            }
      }
      whileInView={{
        opacity: 1,
        scale: 1,
        scaleX: 1,
      }}
      viewport={VIEWPORT_ONCE}
      transition={{
        duration: 0.44,
        ease: PREMIUM_EASE,
      }}
      style={{
        transformOrigin:
          "left center",
      }}
    />
  );
}
