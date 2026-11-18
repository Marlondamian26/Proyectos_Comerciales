"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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
  intervalMs = 6000,
  children,
  className = "",
}: SectionBackgroundProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const mountedRef = useRef(false);

  const validImages = (images || []).filter((img) => img?.url && img.url.trim() !== "");

  useEffect(() => {
    mountedRef.current = true;
  }, []);

  useEffect(() => {
    if (!mountedRef.current || validImages.length <= 1) return;

    const interval = setInterval(() => {
      setPrevIndex(currentIndex);
      setIsTransitioning(true);
      setCurrentIndex((prev) => (prev + 1) % validImages.length);

      setTimeout(() => {
        setIsTransitioning(false);
        setPrevIndex(null);
      }, 500);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [currentIndex, validImages.length, intervalMs]);

  if (validImages.length === 0) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  const currentImage = validImages[currentIndex];
  const prevImage = prevIndex !== null ? validImages[prevIndex] : null;

  const baseImageStyle = {
    filter: `blur(${blur}px)`,
    transform: "scale(1.1) translateZ(0)",
    backfaceVisibility: "hidden" as const,
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 z-0">
        {prevImage && isTransitioning && (
          <div
            className="absolute inset-0 transition-opacity duration-500 ease-in-out"
            style={{ opacity: 0 }}
          >
            <Image
              src={prevImage.url}
              alt={prevImage.alt || "Fondo anterior"}
              fill
              className="object-cover"
              style={baseImageStyle}
              sizes="100vw"
              priority={false}
              loading="lazy"
            />
          </div>
        )}

        <div className="absolute inset-0">
          <Image
            key={currentImage.url}
            src={currentImage.url}
            alt={currentImage.alt || "Fondo de sección"}
            fill
            className="object-cover"
            style={{
              ...baseImageStyle,
              opacity: 1,
            }}
            sizes="100vw"
            priority={currentIndex === 0}
            loading={currentIndex === 0 ? "eager" : "lazy"}
          />
        </div>

        <div
          className="absolute inset-0 bg-background"
          style={{ opacity: overlay }}
        />
      </div>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
