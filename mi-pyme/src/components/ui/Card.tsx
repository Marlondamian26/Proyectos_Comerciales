"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { Badge } from "./Badge";

export interface CardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  image?: { src: string; alt: string };
  badge?: { text: string; variant?: "default" | "success" | "warning" | "error" | "info" | "verified" | "promo" };
  hoverLift?: boolean;
  gradientBorder?: boolean;
  shadow?: "sm" | "md" | "lg" | "xl" | "2xl";
  imageOverlay?: boolean;
  variant?: "default" | "elevated" | "outlined" | "ghost" | "interactive";
  imageAspectRatio?: "1:1" | "4:3" | "16:9" | "3:4";
  footerBorder?: boolean;
}

const variantClasses = {
  default: "bg-surface-base text-content-primary border border-border-default",
  elevated: "bg-surface-raised text-content-primary border border-border-subtle shadow-medium",
  outlined: "bg-surface-base text-content-primary border-2 border-border-default",
  ghost: "bg-transparent text-content-primary border-none",
  interactive: "bg-surface-base text-content-primary border border-border-default hover:shadow-medium transition-shadow duration-200 cursor-pointer",
};

const shadowClasses = {
  sm: "shadow-subtle",
  md: "shadow-medium",
  lg: "shadow-strong",
  xl: "shadow-xl",
  "2xl": "shadow-2xl",
};

export function Card({
  title,
  description,
  icon,
  footer,
  children,
  onClick,
  className,
  image,
  badge,
  hoverLift = true,
  gradientBorder = false,
  shadow = "md",
  imageOverlay = true,
  variant = "default",
  imageAspectRatio,
  footerBorder = true,
}: CardProps) {
  const Wrapper = onClick ? "button" : "div";

  const aspectRatioMap = {
    "1:1": "aspect-square",
    "4:3": "aspect-video",
    "16:9": "aspect-video",
    "3:4": "aspect-[3/4]",
  };

  return (
    <Wrapper
      className={cn(
        "flex flex-col rounded-xl transition-all duration-200",
        variantClasses[variant],
        shadowClasses[shadow],
        hoverLift && onClick && "hover:shadow-xl hover:-translate-y-0.5",
        hoverLift && !onClick && "group hover:shadow-lg",
        gradientBorder && "relative before:absolute before:inset-0 before:rounded-xl before:bg-gradient-primary before:p-[1px] before:-z-10",
        onClick && "cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      onClick={onClick}
      aria-label={title}
    >
      {image && (
        <div className={cn(
          "relative w-full overflow-hidden rounded-t-xl",
          imageAspectRatio ? aspectRatioMap[imageAspectRatio] : "aspect-[4/3]"
        )}>
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className={cn(
              "object-cover transition-transform duration-300 group-hover:scale-105",
            )}
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {imageOverlay && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          )}
          {badge && (
            <Badge
              variant={badge.variant ?? "default"}
              size="sm"
              className="absolute top-3 right-3 font-bold shadow-medium backdrop-blur-sm"
            >
              {badge.text}
            </Badge>
          )}
        </div>
      )}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {(title || icon) && (
          <div className="mb-3 flex items-center gap-3">
            {icon && (
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {icon}
              </span>
            )}
            {title && <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>}
          </div>
        )}
        {description && (
          <p className="text-sm text-secondary leading-relaxed">{description}</p>
        )}
        <div className="mt-4 flex-1">{children}</div>
      </div>
      {footer && (
        <div className={cn(
          "px-4 sm:px-5 py-3 bg-muted/30",
          footerBorder && "border-t border-border-subtle",
          footerBorder && "rounded-b-xl"
        )}>
          {footer}
        </div>
      )}
    </Wrapper>
  );
}

Card.displayName = "Card";

export interface CardLinkProps extends CardProps {
  href: string;
}

export function CardLink({ href, ...props }: CardLinkProps) {
  return (
    <Link href={href} legacyBehavior>
      <Card {...props} />
    </Link>
  );
}

CardLink.displayName = "CardLink";