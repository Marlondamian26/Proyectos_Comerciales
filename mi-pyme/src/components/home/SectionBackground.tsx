"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

interface SectionBackgroundProps {
  images: Array<{ url: string; alt?: string; publicId?: string | null }>;
  overlay?: number;
  blur?: number;
  intervalMs?: number;
  children: React.ReactNode;
  className?: string;
}

export function SectionBackground({
  images,
  overlay = 0.7,
  blur = 8,
  intervalMs = 5000,
  children,
  className = "",
}: SectionBackgroundProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mounted, setMounted] = useState(false);

  const validImages = (images || []).filter((img) => img?.url);

  const next = useCallback(() => {
    setActiveImageIndex((prev) => (prev + 1) % validImages.length);
  }, [validImages.length]);

  const prev = useCallback(() => {
    setActiveImageIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  }, [validImages.length]);

  const currentImage = validImages?.[activeImageIndex];

  // Respetar prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  // Solo montar la rotación después de hidratar (evita flashback en SSR)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || validImages.length <= 1 || isPaused || prefersReducedMotion) return;
    const interval = setInterval(next, intervalMs);
    return () => clearInterval(interval);
  }, [mounted, validImages.length, intervalMs, next, isPaused, prefersReducedMotion]);

  if (validImages.length === 0) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  const transitionStyle = mounted
    ? { transition: "opacity 800ms ease-in-out", willChange: "opacity" as const }
    : { transition: "none" as const, willChange: "auto" as const };

  const imageStyle = {
    filter: `blur(${blur}px)`,
    transform: "scale(1.1)",
    backfaceVisibility: "hidden" as const,
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Fondo de imágenes con carrusel optimizado para mobile */}
      <div className="absolute inset-0 z-0">
        {validImages.length > 1 ? (
          <div
            className="absolute inset-0"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {validImages.map((img, index) => (
              <div
                key={`${img.url}-${index}`}
                className="absolute inset-0"
                style={{
                  opacity: index === activeImageIndex ? 1 : 0,
                  ...transitionStyle,
                }}
                aria-hidden={index !== activeImageIndex}
              >
                <Image
                  src={img.url}
                  alt={img.alt || "Fondo de sección"}
                  fill
                  sizes="100vw"
                  priority={index === 0}
                  loading={index === 0 ? "eager" : "lazy"}
                  className="object-cover"
                  style={imageStyle}
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
            loading="eager"
            className="object-cover"
            style={imageStyle}
          />
        )}
        {/* Overlay para contraste del contenido */}
        <div
          className="absolute inset-0 bg-background"
          style={{ opacity: overlay }}
        />
      </div>

      {/* Indicadores de paginación (solo si hay más de una imagen) */}
      {validImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {validImages.map((_, index) => (
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
