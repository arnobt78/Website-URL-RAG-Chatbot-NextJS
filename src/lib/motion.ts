import { type Variants } from "framer-motion";

/** Smooth enter easing used across landing stagger reveals. */
export const easeOut = [0.22, 1, 0.36, 1] as const;

/** Viewport trigger — once visible, stay revealed (no flicker on scroll back). */
export const viewportOnce = { once: true, amount: 0.25 } as const;

/** Fade + slide reveal from bottom (default section entrance). */
export function revealVariants(distance = 24): Variants {
  return {
    hidden: { opacity: 0, y: distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: easeOut },
    },
  };
}

/** Stagger children in a grid/list (stair / magazine wave). */
export function staggerContainer(stagger = 0.08, delayChildren = 0.05): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  };
}

/** Per-line stair reveal for headings (each word/line steps in). */
export function stairLineVariants(index: number): Variants {
  return {
    hidden: { opacity: 0, y: 20, x: index % 2 === 0 ? -12 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: { duration: 0.5, ease: easeOut, delay: index * 0.12 },
    },
  };
}
