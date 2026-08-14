"use client";

import {
  useRef,
  type ReactNode,
} from "react";

import {
  m,
  useScroll,
  useTransform,
} from "motion/react";

import {
  usePortfolioMotion,
} from "@/components/motion/motion-provider";

export default function SubtleParallax({
  children,
  className,
  distance = 28,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
}) {
  const ref =
    useRef<HTMLDivElement | null>(
      null,
    );

  const {
    finePointer,
    isPremium,
  } = usePortfolioMotion();

  const enabled =
    finePointer &&
    isPremium;

  const {
    scrollYProgress,
  } = useScroll({
    target: ref,
    offset: [
      "start end",
      "end start",
    ],
  });

  const y =
    useTransform(
      scrollYProgress,
      [
        0,
        1,
      ],
      [
        -distance / 2,
        distance / 2,
      ],
    );

  return (
    <m.div
      ref={ref}
      className={className}
      style={
        enabled
          ? {
              y,
            }
          : undefined
      }
    >
      {children}
    </m.div>
  );
}
