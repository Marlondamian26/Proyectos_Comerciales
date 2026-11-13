"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

interface SectionBackgroundProps {
  images: Array<{ url: string; alt?: string; publicId?: string | null }>;
  overlay?: number;
  blur?: number;
  children: React.ReactNode;
  className?: string;
  intervalMs?: number;
}

export function SectionBackground({
  images,
  overlay = 0.7,
  blur = 8,
  children,
  className = "",
  intervalMs = 5000,
}: SectionBackgroundProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const currentImage = images?.[activeImageIndex];

  // Respetar prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  useEffect(() => {
    if (images.length <= 1 || isPaused || prefersReducedMotion) return;
    const interval = setInterval(next, intervalMs);
    return () => clearInterval(interval);
  }, [images.length, intervalMs, next, isPaused, prefersReducedMotion]);

  if (!images || images.length === 0) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Imagen de fondo con blur y carrusel dinámico */}
      <div className="absolute inset-0 z-0">
        {images.length > 1 ? (
          <div
            className="absolute inset-0"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {images.map((img, index) => (
              <div
                key={img.url}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === activeImageIndex ? "opacity-100" : "opacity-0"
                }`}
                aria-hidden={index !== activeImageIndex}
              >
                <Image
                  src={img.url}
                  alt={img.alt || "Fondo de sección"}
                  fill
                  sizes="100vw"
                  priority={index === activeImageIndex}
                  className="object-cover"
                  style={{ filter: `blur(${blur}px)`, transform: "scale(1.1)" }}
                />
              </div>
            ))}
          </div>
        ) : (
          <Image
            src={currentImage!.url}
            alt={currentImage!.alt || "Fondo de sección"}
            fill
            sizes="100vw"
            priority
            className="object-cover"
            style={{ filter: `blur(${blur}px)`, transform: "scale(1.1)" }}
          />
        )}
        {/* Overlay para contraste del contenido */}
        <div className="absolute inset-0 bg-background" style={{ opacity: overlay }} />
      </div>

      {/* Indicadores de paginación (solo si hay más de una imagen) */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveImageIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === activeImageIndex
                  ? "w-8 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Ir a imagen ${index + 1}`}
              aria-current={index === activeImageIndex}
            />
          ))}
        </div>
      )}

      {/* Contenido */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
