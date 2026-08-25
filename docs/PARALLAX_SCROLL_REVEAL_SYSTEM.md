# Universal Parallax Scroll Reveal System

Reusable, framework-friendly motion guide for modern UIs.
Use this file as a copy-paste reference in any React + Framer Motion project.

---

## What This System Covers

- Fade/translate reveals from left, right, and bottom.
- Soft appear/disappear on viewport enter/leave.
- One-by-one stagger reveal for cards/lists.
- Stair-step line reveal for headings/text.
- Subtle parallax tied to scroll progress.
- Easy-to-tune motion tokens (`duration`, `delay`, `ease`, `distance`).

---

## Motion Principles

1. Keep transforms small (`12px` to `36px`) for readable motion.
2. Prefer `opacity + translate + tiny scale` over aggressive effects.
3. Use stagger for hierarchy, not decoration.
4. Keep parallax subtle and non-blocking.
5. Respect reduced motion preferences.

---

## Recommended Tokens

| Token | Suggested Range | Typical Default |
| --- | --- | --- |
| `duration` | `0.35 - 0.75` | `0.55` |
| `stagger` | `0.04 - 0.12` | `0.08` |
| `distance` | `12 - 40` px | `24` px |
| `easeOut` | smooth enter | `[0.22, 1, 0.36, 1]` |
| `easeIn` | smooth exit | `[0.64, 0, 0.78, 0]` |
| `viewportAmount` | `0.25 - 0.7` | `0.4` |

---

## 1) Base Reveal Variants (Left / Right / Bottom / Appear)

```tsx
import { Variants } from "framer-motion";

type Direction = "left" | "right" | "bottom" | "appear";

export function revealVariants(
  direction: Direction = "bottom",
  distance = 24,
): Variants {
  const axis =
    direction === "left"
      ? { x: -distance, y: 0 }
      : direction === "right"
        ? { x: distance, y: 0 }
        : direction === "bottom"
          ? { x: 0, y: distance }
          : { x: 0, y: 0 };

  return {
    hidden: {
      opacity: 0,
      ...axis,
      scale: 0.985,
      filter: "blur(4px)",
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1], // ease out
      },
    },
    exit: {
      opacity: 0,
      ...axis,
      scale: 0.99,
      transition: {
        duration: 0.28,
        ease: [0.64, 0, 0.78, 0], // ease in
      },
    },
  };
}
```

---

## 2) Universal `ScrollReveal` Wrapper

```tsx
import { motion } from "framer-motion";
import { revealVariants } from "./revealVariants";

export function ScrollReveal({
  children,
  direction = "bottom",
  once = false,
  delay = 0,
}: {
  children: React.ReactNode;
  direction?: "left" | "right" | "bottom" | "appear";
  once?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      variants={revealVariants(direction, 24)}
      initial="hidden"
      whileInView="visible"
      exit="exit"
      viewport={{ once, amount: 0.4, margin: "0px 0px -10% 0px" }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
```

---

## 3) Stagger Container (One-by-One Cards/Rows)

```tsx
import { motion } from "framer-motion";

const staggerParent = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const staggerChild = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export function StaggerList({ items }: { items: string[] }) {
  return (
    <motion.ul
      variants={staggerParent}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.3 }}
    >
      {items.map((item) => (
        <motion.li key={item} variants={staggerChild}>
          {item}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

---

## 4) Stair-Line Reveal (Heading or Paragraph Lines)

```tsx
import { motion } from "framer-motion";

export function StairLines({ lines }: { lines: string[] }) {
  return (
    <div>
      {lines.map((line, i) => (
        <motion.span
          key={line + i}
          className="block"
          initial={{ opacity: 0, x: -14, y: 6, clipPath: "inset(0 100% 0 0)" }}
          whileInView={{ opacity: 1, x: 0, y: 0, clipPath: "inset(0 0 0 0)" }}
          viewport={{ once: false, amount: 0.7 }}
          transition={{
            delay: i * 0.08,
            duration: 0.52,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {line}
        </motion.span>
      ))}
    </div>
  );
}
```

---

## 5) Parallax Section (Subtle Scroll-Linked Motion)

```tsx
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function ParallaxSection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 36]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.985]);

  return (
    <section ref={ref}>
      <motion.div style={{ y, opacity, scale }}>{children}</motion.div>
    </section>
  );
}
```

---

## 6) Ease-Out to Ease-In Pattern (Enter/Exit)

Use this when elements should feel soft on enter and clean on exit:

- Enter (`ease out`): `[0.22, 1, 0.36, 1]`
- Exit (`ease in`): `[0.64, 0, 0.78, 0]`

This avoids abrupt fade-outs and keeps transitions professional.

---

## 7) Reduced Motion Safety

```tsx
import { useReducedMotion } from "framer-motion";

const prefersReducedMotion = useReducedMotion();
const motionProps = prefersReducedMotion
  ? { initial: false, animate: { opacity: 1 } }
  : { initial: "hidden", whileInView: "visible" };
```

Keep this in shared wrappers so accessibility is automatic.

---

## 8) Implementation Checklist

- Add one shared reveal wrapper component.
- Standardize direction presets (`left`, `right`, `bottom`, `appear`).
- Use one parent stagger variant for repeated lists.
- Use stair-line reveal for hero/subtitles only.
- Keep parallax optional and subtle.
- Test on mobile and low-power devices.
- Avoid using animation state for data/business logic.

---

## 9) Quick Copy Command Set (Prompt Ready)

When reusing in another project, ask:

- "Create a `ScrollReveal` wrapper with left/right/bottom/appear variants."
- "Add stagger parent/child variants for cards."
- "Animate heading lines in a stair sequence."
- "Add subtle parallax with `useScroll` and `useTransform`."
- "Use ease-out for enter and ease-in for exit."
- "Keep motion reduced preference support enabled."

This file is intentionally universal so it can be dropped into any repo and implemented quickly.
