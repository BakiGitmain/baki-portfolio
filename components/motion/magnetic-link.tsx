"use client";

import {
  m,
  useMotionValue,
  useSpring,
  type HTMLMotionProps,
} from "motion/react";

import {
  CONTROLLED_SPRING,
} from "@/components/motion/motion-config";

import {
  usePortfolioMotion,
} from "@/components/motion/motion-provider";

export default function MagneticLink({
  children,
  onPointerLeave,
  onPointerMove,
  ...props
}: HTMLMotionProps<"a">) {
  const {
    finePointer,
    isPremium,
  } = usePortfolioMotion();

  const x =
    useMotionValue(0);

  const y =
    useMotionValue(0);

  const springX =
    useSpring(
      x,
      {
        stiffness: 420,
        damping: 34,
        mass: 0.55,
      },
    );

  const springY =
    useSpring(
      y,
      {
        stiffness: 420,
        damping: 34,
        mass: 0.55,
      },
    );

  const enabled =
    finePointer &&
    isPremium;

  return (
    <m.a
      {...props}
      style={
        enabled
          ? {
              ...props.style,
              x: springX,
              y: springY,
            }
          : props.style
      }
      whileTap={{
        scale: 0.98,
      }}
      transition={CONTROLLED_SPRING}
      onPointerMove={(
        event,
      ) => {
        onPointerMove?.(
          event,
        );

        if (!enabled) {
          return;
        }

        const bounds =
          event.currentTarget.getBoundingClientRect();

        x.set(
          (
            event.clientX -
            (
              bounds.left +
              bounds.width / 2
            )
          ) * 0.055,
        );

        y.set(
          -2 +
            (
              event.clientY -
              (
                bounds.top +
                bounds.height / 2
              )
            ) *
              0.045,
        );
      }}
      onPointerLeave={(
        event,
      ) => {
        onPointerLeave?.(
          event,
        );

        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </m.a>
  );
}
