export const PREMIUM_EASE = [
  0.22,
  1,
  0.36,
  1,
] as const;

export const CONTROLLED_SPRING = {
  type: "spring" as const,
  stiffness: 320,
  damping: 30,
  mass: 0.72,
};

export const VIEWPORT_ONCE = {
  once: true,
  amount: 0.16,
  margin: "0px 0px -9% 0px",
} as const;

export const MOTION_TIMING = {
  fast: 0.32,
  standard: 0.56,
  heading: 0.68,
  wordStagger: 0.055,
  itemStagger: 0.085,
} as const;
