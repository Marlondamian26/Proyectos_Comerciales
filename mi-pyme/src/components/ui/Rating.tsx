"use client";

import { cn } from "@/lib/utils";
import { Star, StarHalf, StarIcon } from "lucide-react";
import * as React from "react";

export interface RatingProps
  extends React.HTMLAttributes<HTMLDivElement> {
  rating: number;
  reviewCount?: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
  showCount?: boolean;
  allowHalf?: boolean;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function Rating({
  rating,
  reviewCount,
  maxRating = 5,
  size = "md",
  readOnly = true,
  showCount = true,
  allowHalf = true,
  className,
  ...props
}: RatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalf = allowHalf && rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const hasNearFull = rating - fullStars >= 0.75;
  const emptyStars = maxRating - fullStars - (hasHalf ? 1 : hasNearFull ? 0 : 0);
  const displayFull = hasNearFull ? fullStars + 1 : fullStars;
  const displayEmpty = hasHalf ? emptyStars - 1 : emptyStars;

  const stars = [];
  for (let i = 0; i < displayFull; i++) {
    stars.push(
      <StarIcon
        key={`full-${i}`}
        className={cn(sizeClasses[size], "fill-yellow-400 text-yellow-400")}
        aria-hidden="true"
      />
    );
  }
  if (hasHalf) {
    stars.push(
      <StarHalf
        key="half"
        className={cn(sizeClasses[size], "fill-yellow-400 text-yellow-400")}
        aria-hidden="true"
      />
    );
  }
  for (let i = 0; i < (hasHalf ? displayEmpty : displayEmpty); i++) {
    stars.push(
      <Star
        key={`empty-${i}`}
        className={cn(sizeClasses[size], "fill-muted text-muted-foreground/30")}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1",
        readOnly && "cursor-default",
        className
      )}
      role="img"
      aria-label={reviewCount !== undefined ? `${rating} de ${maxRating} estrellas (${reviewCount} reseñas)` : `${rating} de ${maxRating} estrellas`}
      {...props}
    >
      <div className="flex items-center" aria-hidden="true">
        {stars}
      </div>
      {showCount && reviewCount !== undefined && (
        <span
          className={cn(
            "text-xs text-secondary",
            size === "lg" && "text-sm"
          )}
        >
          ({reviewCount})
        </span>
      )}
    </div>
  );
}

Rating.displayName = "Rating";