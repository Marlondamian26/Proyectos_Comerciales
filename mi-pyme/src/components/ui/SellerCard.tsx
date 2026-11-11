"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { Badge } from "./Badge";
import { Rating } from "./Rating";

export interface SellerCardProps {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  rating?: number;
  reviewCount?: number;
  transactionCount?: number;
  responseTime?: string;
  verified?: boolean;
  active?: boolean;
  area?: string;
  trustBadges?: Array<{ type: string; count?: number }>;
  href?: string;
  className?: string;
  showVerifyBadge?: boolean;
}

export function SellerCard({
  name,
  description,
  logoUrl,
  bannerUrl,
  rating,
  reviewCount,
  transactionCount,
  responseTime,
  verified = false,
  active = true,
  area,
  trustBadges = [],
  href,
  className,
  showVerifyBadge = true,
}: SellerCardProps) {
  const Wrapper = href ? "div" : "div";

  return (
    <Wrapper
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-elevated",
        "transition-all duration-300 hover:shadow-medium hover:-translate-y-0.5",
        !active && "opacity-60 grayscale",
        className
      )}
    >
      <div className="relative aspect-[2/1] w-full overflow-hidden">
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt={`Banner de ${name}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-primary/10 to-secondary/10" />
        )}
        {showVerifyBadge && verified && (
          <div className="absolute top-2 right-2">
            <Badge variant="verified" size="sm">
              Verificado
            </Badge>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 p-4">
        {logoUrl ? (
          <div className="relative -mt-6 h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 border-background">
            <Image
              src={logoUrl}
              alt={`Logo de ${name}`}
              fill
              className="object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="-mt-6 flex-shrink-0 h-12 w-12 rounded-full border-2 border-background bg-muted/50 flex items-center justify-center">
            <span className="text-xs font-bold text-secondary">
              {name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">{name}</h3>
            {active ? (
              <Badge variant="success" size="sm" dot>
                Activo
              </Badge>
            ) : (
              <Badge variant="default" size="sm" dot>
                Inactivo
              </Badge>
            )}
          </div>

          {rating !== undefined && (
            <div className="mt-1">
              <Rating rating={rating} reviewCount={reviewCount} readOnly />
            </div>
          )}

          {transactionCount !== undefined && (
            <p className="mt-1 text-xs text-tertiary">
              {transactionCount} transacciones
            </p>
          )}

          {description && (
            <p className="mt-2 text-sm text-secondary line-clamp-2">
              {description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {area && (
              <span className="text-xs text-tertiary">📍 {area}</span>
            )}
            {responseTime && (
              <span className="text-xs text-tertiary">🕐 {responseTime}</span>
            )}
            {trustBadges.map((badge, i) => (
              <Badge key={`${badge.type}-${i}`} variant="outline" size="sm">
                {badge.type}
                {badge.count && ` (${badge.count})`}
              </Badge>
            ))}
          </div>

          {href && (
            <Link
              href={href}
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Ver negocio →
            </Link>
          )}
        </div>
      </div>
    </Wrapper>
  );
}

SellerCard.displayName = "SellerCard";