"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { ImageWithFallback } from "./ImageWithFallback";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

export interface ProductGalleryProps {
  images: Array<{ src: string; alt: string }>;
  className?: string;
  showThumbnails?: boolean;
  enableZoom?: boolean;
  aspectRatio?: "1:1" | "4:3" | "16:9" | "3:4";
}

export function ProductGallery({
  images,
  className,
  showThumbnails = true,
  enableZoom = false,
  aspectRatio = "1:1",
}: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [showFullscreen, setShowFullscreen] = React.useState(false);
  const [zoomPosition, setZoomPosition] = React.useState({ x: 0, y: 0 });

  if (!images || images.length === 0) {
    return (
      <div className={cn("relative", className)}>
        <ImageWithFallback
          src={null}
          alt="Sin imagen"
          aspectRatio={aspectRatio}
          className="border border-border-subtle"
        />
      </div>
    );
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

   const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleZoomClick = () => {
    if (enableZoom) {
      setShowFullscreen((prev) => !prev);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableZoom) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const mainImage = images[currentIndex];

  return (
    <div className={cn("relative", className)}>
      <div
        className="relative mb-3 overflow-hidden rounded-lg border border-border-subtle"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoomPosition({ x: 0, y: 0 })}
      >
         <ImageWithFallback
           src={mainImage.src}
           alt={mainImage.alt}
           aspectRatio={aspectRatio}
           containerClassName={cn(
             enableZoom && "zoomable",
             showFullscreen && "cursor-zoom-out"
           )}
           className={cn(
             enableZoom && "object-cover",
             "[&.zoomable:hover]:cursor-zoom-in"
           )}
           onClick={enableZoom ? handleZoomClick : undefined}
           priority={currentIndex === 0}
           placeholder={currentIndex > 0 ? "empty" : "blur"}
         />

        {enableZoom && (
          <div
            className="pointer-events-none absolute inset-0 hidden sm:block"
            style={{
              background: `radial-gradient(circle at ${zoomPosition.x}% ${zoomPosition.y}%, rgba(0,0,0,0.1) 0%, transparent 70%)`,
            }}
          />
        )}

        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              aria-label="Imagen anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-surface/80 backdrop-blur-sm"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              aria-label="Imagen siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-surface/80 backdrop-blur-sm"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </>
        )}
      </div>

      {showThumbnails && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={`${image.src}-${index}`}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Miniatura ${index + 1}`}
              aria-current={index === currentIndex ? "true" : undefined}
              className={cn(
                "relative flex-shrink-0 overflow-hidden rounded-lg border-2",
                index === currentIndex
                  ? "border-primary"
                  : "border-border-subtle hover:border-border"
              )}
            >
              <ImageWithFallback
                src={image.src}
                alt={image.alt}
                aspectRatio="1:1"
                containerClassName="h-16 w-16"
                className="h-16 w-16 object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <div className="mt-2 flex justify-center gap-1">
        {images.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentIndex(index)}
            aria-label={`Ir a imagen ${index + 1}`}
            aria-current={index === currentIndex ? "true" : undefined}
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-all",
              index === currentIndex
                ? "w-6 bg-primary"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}

ProductGallery.displayName = "ProductGallery";