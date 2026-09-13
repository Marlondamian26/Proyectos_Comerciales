"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import * as React from "react";

export interface CardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  image?: { src: string; alt: string };
  badge?: { text: string; variant?: "default" | "success" | "warning" | "error" | "info" };
  hoverLift?: boolean;
  gradientBorder?: boolean;
  shadow?: "sm" | "md" | "lg" | "xl" | "2xl";
  imageOverlay?: boolean;
  variant?: "default" | "elevated" | "outlined" | "ghost";
}

const badgeClasses = {
  default: "bg-muted text-muted-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};

const variantClasses = {
  default: "bg-surface text-foreground border border-border",
  elevated: "bg-surface-elevated text-foreground border border-border shadow-theme-lg",
  outlined: "bg-background text-foreground border-2 border-border",
  ghost: "bg-transparent text-foreground border-none",
};

const shadowClasses = {
  sm: "shadow-theme-sm",
  md: "shadow-theme-md",
  lg: "shadow-theme-lg",
  xl: "shadow-theme-xl",
  "2xl": "shadow-theme-2xl",
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
}: CardProps) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      className={cn(
        "flex flex-col rounded-xl transition-all duration-300",
        variantClasses[variant],
        shadowClasses[shadow],
        hoverLift && onClick && "hover-lift hover:shadow-theme-xl",
        hoverLift && !onClick && "group hover:shadow-theme-lg",
        gradientBorder && "relative before:absolute before:inset-0 before:rounded-xl before:bg-gradient-primary before:p-[1px] before:-z-10",
        onClick && "cursor-pointer text-left",
        className
      )}
      onClick={onClick}
      aria-label={title}
    >
      {image && (
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
          <img
            src={image.src}
            alt={image.alt}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {imageOverlay && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          )}
          {badge && (
            <span
              className={cn(
                "absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-bold shadow-theme-md backdrop-blur-sm",
                badgeClasses[badge.variant ?? "default"]
              )}
            >
              {badge.text}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-col flex-1 p-5">
        {(title || icon) && (
          <div className="mb-3 flex items-center gap-3">
            {icon && (
              <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                {icon}
              </span>
            )}
            {title && <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>}
          </div>
        )}
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
        <div className="mt-4 flex-1">{children}</div>
      </div>
      {footer && (
        <div className="border-t border-border/50 px-5 py-3 bg-muted/30 rounded-b-xl">
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