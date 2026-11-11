"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

interface HeroCarouselImage {
  id: string;
  url: string;
  alt: string;
}

interface HeroCarouselProps {
  images: HeroCarouselImage[];
  intervalMs?: number;
}

export function HeroCarousel({
  images,
  intervalMs = 5000,
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1 || isPaused) return;
    const interval = setInterval(next, intervalMs);
    return () => clearInterval(interval);
  }, [images.length, intervalMs, next, isPaused]);

  // Respetar prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  if (prefersReducedMotion || images.length <= 1) {
    return (
      <div className="absolute inset-0">
        <Image
          src={images[0]?.url ?? "/images/placeholder.svg"}
          alt={images[0]?.alt ?? "Hero"}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {images.map((img, index) => (
        <div
          key={img.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={index !== currentIndex}
        >
          <Image
            src={img.url}
            alt={img.alt}
            fill
            priority={index === 0}
            className="object-cover"
            sizes="100vw"
          />
        </div>
      ))}

      {/* Indicadores */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "w-8 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Ir a imagen ${index + 1}`}
              aria-current={index === currentIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
}
