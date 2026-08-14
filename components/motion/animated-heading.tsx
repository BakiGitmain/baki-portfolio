"use client";

import {
  m,
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

type HeadingSegment = {
  accent?: boolean;
  breakAfter?: boolean;
  text: string;
};

type AnimatedHeadingProps = {
  accentClassName?: string;
  active?: boolean;
  as?:
    | "h1"
    | "h2"
    | "h3";
  className?: string;
  delay?: number;
  language:
    | "am"
    | "en";
  mode?:
    | "hero"
    | "viewport";
  segments: HeadingSegment[];
  skipInitial?: boolean;
};

type SegmenterPart = {
  isWordLike?: boolean;
  segment: string;
};

function segmentWords(
  text: string,
  language:
    | "am"
    | "en",
) {
  if (
    typeof Intl !==
      "undefined" &&
    "Segmenter" in Intl
  ) {
    const segmenter =
      new Intl.Segmenter(
        language,
        {
          granularity:
            "word",
        },
      );

    const chunks: string[] = [];

    for (
      const part of segmenter.segment(
        text,
      ) as unknown as Iterable<SegmenterPart>
    ) {
      if (
        part.isWordLike ===
          false ||
        /^\s+$/u.test(
          part.segment,
        )
      ) {
        if (
          chunks.length > 0
        ) {
          chunks[
            chunks.length - 1
          ] += part.segment;
        } else {
          chunks.push(
            part.segment,
          );
        }

        continue;
      }

      chunks.push(
        part.segment,
      );
    }

    return chunks;
  }

  return (
    text.match(
      /\S+\s*/gu,
    ) ?? [text]
  );
}

export default function AnimatedHeading({
  accentClassName = "text-[#426c2b]",
  active = true,
  as = "h2",
  className,
  delay = 0,
  language,
  mode = "viewport",
  segments,
  skipInitial = false,
}: AnimatedHeadingProps) {
  const {
    intensity,
    reducedMotion,
  } = usePortfolioMotion();

  const Tag = as;

  const fullText =
    segments
      .map(
        (segment) =>
          `${segment.text}${
            segment.breakAfter
              ? " "
              : ""
          }`,
      )
      .join("")
      .trim();

  const movement =
    reducedMotion
      ? 0
      : intensity ===
          "minimal"
        ? 9
        : "108%";

  const wordVariants: Variants = {
    hidden: {
      opacity: 0,
      rotateX:
        intensity ===
          "premium" &&
        !reducedMotion
          ? 7
          : 0,
      y: movement,
    },
    visible: {
      opacity: 1,
      rotateX: 0,
      y: 0,
      transition: {
        duration:
          intensity ===
          "minimal"
            ? 0.4
            : MOTION_TIMING.heading,
        ease: PREMIUM_EASE,
      },
    },
  };

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        delayChildren: delay,
        staggerChildren:
          intensity ===
          "minimal"
            ? 0.035
            : MOTION_TIMING.wordStagger,
      },
    },
  };

  const trigger =
    mode === "hero"
      ? {
          animate:
            active
              ? "visible"
              : "hidden",
        }
      : {
          viewport:
            VIEWPORT_ONCE,
          whileInView:
            "visible",
        };

  return (
    <Tag
      className={className}
      aria-label={fullText}
    >
      <m.span
        aria-hidden="true"
        className="inline"
        initial={
          skipInitial
            ? false
            : "hidden"
        }
        variants={containerVariants}
        {...trigger}
      >
        {segments.map(
          (
            segment,
            segmentIndex,
          ) => (
            <span
              key={`${segmentIndex}-${segment.text}`}
              className={
                segment.accent
                  ? `motion-heading-accent ${accentClassName}`
                  : undefined
              }
            >
              {segmentWords(
                segment.text,
                language,
              ).map(
                (
                  word,
                  wordIndex,
                ) => (
                  <span
                    key={`${wordIndex}-${word}`}
                    className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]"
                  >
                    <m.span
                      className="inline-block whitespace-pre"
                      variants={wordVariants}
                    >
                      {word}
                    </m.span>
                  </span>
                ),
              )}

              {segment.breakAfter && (
                <br />
              )}
            </span>
          ),
        )}
      </m.span>
    </Tag>
  );
}
