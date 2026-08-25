"use client";

import { useEffect, useRef, useState } from "react";

/** Local hero backgrounds — avoids remote optimizer quota burn. */
const HERO_IMAGES = [
  "/hero/ai-neural.jpg",
  "/hero/data-stream.jpg",
  "/hero/digital-earth.jpg",
  "/hero/robot-tech.jpg",
  "/hero/circuit-board.jpg",
];

const CROSSFADE_MS = 1750;
const KEN_BURNS_MS = 14000;
const REDUCED_MOTION_INTERVAL_MS = 8000;

/**
 * Two-layer rotating hero background with crossfade + Ken Burns zoom.
 * Follows docs/HERO_ROTATING_BACKGROUND_SPEC.md; respects prefers-reduced-motion.
 */
export function HeroBackground() {
  const [activeLayer, setActiveLayer] = useState(0);
  const [images, setImages] = useState<[string, string]>([HERO_IMAGES[0], HERO_IMAGES[1]]);
  const slideRef = useRef(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const advanceSlide = () => {
      slideRef.current = (slideRef.current + 1) % HERO_IMAGES.length;
      const next = slideRef.current;
      setActiveLayer((layer) => {
        const inactive = layer === 0 ? 1 : 0;
        setImages((current) => {
          const updated: [string, string] = [...current];
          updated[inactive] = HERO_IMAGES[next];
          return updated;
        });
        return inactive;
      });
    };

    if (reducedMotion) {
      const intervalId = setInterval(advanceSlide, REDUCED_MOTION_INTERVAL_MS);
      return () => clearInterval(intervalId);
    }

    const timeoutId = setInterval(advanceSlide, KEN_BURNS_MS);
    return () => clearInterval(timeoutId);
  }, []);

  return (
    <div className="hero__media" aria-hidden="true">
      {[0, 1].map((layer) => (
        <div
          key={layer}
          className={`hero__bg-layer ${activeLayer === layer ? "hero__bg-layer--active hero__bg-layer--ken-burns" : ""}`}
          style={{
            backgroundImage: `url("${images[layer]}")`,
            transitionDuration: `${CROSSFADE_MS}ms`,
          }}
        />
      ))}
    </div>
  );
}
