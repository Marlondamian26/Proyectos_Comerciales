"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import * as React from "react";
import { CardImageFallback } from "./CardImageFallback";

export interface ImageWithFallbackProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallback?: React.ReactNode;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  containerClassName?: string;
  aspectRatio?: "1:1" | "4:3" | "16:9" | "3:4";
  placeholder?: "blur" | "empty";
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  tipo?: "producto" | "servicio" | "negocio" | "envio" | "combo" | "default";
  nombre?: string;
}

const aspectRatios: Record<NonNullable<ImageWithFallbackProps["aspectRatio"]>, string> = {
  "1:1": "aspect-square",
  "4:3": "aspect-video",
  "16:9": "aspect-video w-full",
  "3:4": "aspect-[3/4]",
};

export function ImageWithFallback({
  src,
  alt,
  width,
  height,
  className,
  fallback,
  priority = false,
  fill = false,
  sizes,
  containerClassName,
   aspectRatio = "1:1",
   placeholder = "blur",
   onClick,
  tipo = "default",
  nombre,
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const handleError = React.useCallback(() => {
    setHasError(true);
  }, []);

  const handleLoad = React.useCallback(() => {
    setIsLoaded(true);
  }, []);

  const imgClassName = cn(
    "object-cover",
    "transition-opacity duration-300",
    isLoaded ? "opacity-100" : "opacity-0",
    className
  );

  const containerClasses = cn(
    "relative overflow-hidden",
    aspectRatio && aspectRatios[aspectRatio],
    containerClassName
  );

  const defaultFallback = (
    <CardImageFallback tipo={tipo} nombre={nombre} />
  );

  if (!src || hasError) {
    return (
      <div className={cn(containerClasses, "bg-muted/30")}>
        {fallback ?? defaultFallback}
      </div>
    );
  }

  return (
     <div className={containerClasses} onClick={onClick}>
      {!isLoaded && placeholder === "blur" && (
        <div className="absolute inset-0 bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes}
        priority={priority}
        className={imgClassName}
        onError={handleError}
        onLoad={handleLoad}
        loading={priority ? "eager" : "lazy"}
      />
    </div>
  );
}

ImageWithFallback.displayName = "ImageWithFallback";