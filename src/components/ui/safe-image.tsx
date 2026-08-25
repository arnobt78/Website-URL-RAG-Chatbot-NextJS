"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type SafeImageProps = ImageProps & {
  /** Alt text is required for accessibility on hero/feature images. */
  alt: string;
};

/**
 * Tries next/image first; on optimizer/upstream failure falls back to native img
 * so remote or quota-limited images still render (see docs/SAFE_IMAGE_REUSABLE_COMPONENT.md).
 */
export function SafeImage({ src, alt, className, ...rest }: SafeImageProps) {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback && typeof src === "string" && src.length > 0) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- intentional optimizer bypass fallback
      <img
        src={src}
        alt={alt}
        className={cn(className)}
        loading={rest.loading === "eager" ? "eager" : "lazy"}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      onError={() => setUseFallback(true)}
      {...rest}
    />
  );
}
