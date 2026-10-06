"use client";

import { cn } from "@/lib/utils";
import { ShieldCheck, TrendingUp, Award, Clock } from "lucide-react";
import * as React from "react";
import { Badge } from "./Badge";

export type TrustBadgeType =
  | "verified"
  | "top-seller"
  | "fast-response"
  | "award-winning"
  | "popular";

interface TrustBadgeConfig {
  label: string;
  icon: React.ReactNode;
  badgeVariant: "verified" | "promo" | "success" | "info" | "primary";
}

const trustConfigs: Record<TrustBadgeType, TrustBadgeConfig> = {
  verified: {
    label: "Verificado",
    icon: <ShieldCheck className="h-3 w-3" />,
    badgeVariant: "verified",
  },
  "top-seller": {
    label: "Top Seller",
    icon: <Award className="h-3 w-3" />,
    badgeVariant: "success",
  },
  "fast-response": {
    label: "Responde rápido",
    icon: <Clock className="h-3 w-3" />,
    badgeVariant: "info",
  },
  "award-winning": {
    label: "Premiado",
    icon: <Award className="h-3 w-3" />,
    badgeVariant: "promo",
  },
  popular: {
    label: "Popular",
    icon: <TrendingUp className="h-3 w-3" />,
    badgeVariant: "primary",
  },
};

export interface TrustBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  type: TrustBadgeType;
  count?: number;
  showIcon?: boolean;
}

export function TrustBadge({
  type,
  count,
  showIcon = true,
  className,
  ...props
}: TrustBadgeProps) {
  const config = trustConfigs[type];

  return (
    <Badge
      variant={config.badgeVariant}
      size="sm"
      icon={showIcon ? config.icon : undefined}
      className={cn("gap-1 font-medium", className)}
      {...props}
    >
      {config.label}
      {count !== undefined && count > 0 && (
        <span className="ml-1 text-xs">({count})</span>
      )}
    </Badge>
  );
}

TrustBadge.displayName = "TrustBadge";