"use client";

import Image from "next/image";
import { useState } from "react";

interface SectionBackgroundProps {
  images: Array<{ url: string; alt?: string; publicId?: string | null }>;
  overlay?: number;
  blur?: number;
  children: React.ReactNode;
  className?: string;
}

export function SectionBackground({
  images,
  overlay = 0.7,
  blur = 8,
  children,
  className = "",
}: SectionBackgroundProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const currentImage = images?.[activeImageIndex];

  if (!images || images.length === 0) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Imagen de fondo con blur y carrusel sutil */}
      <div className="absolute inset-0 z-0">
        <Image
          src={currentImage.url}
          alt={currentImage.alt || "Fondo de sección"}
          fill
          sizes="100vw"
          className={`object-cover transition-transform duration-7000 ease-linear ${activeImageIndex === 0 ? "scale-100" : "scale-105"}`}
          priority={activeImageIndex === 0}
          style={{ filter: `blur(${blur}px)`, transform: "scale(1.1)" }}
        />
        {/* Overlay para contraste del contenido */}
        <div className="absolute inset-0 bg-background" style={{ opacity: overlay }} />
      </div>

      {/* Contenido */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
