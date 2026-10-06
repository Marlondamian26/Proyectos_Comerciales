import { cn } from "@/lib/utils";
import * as React from "react";

export type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "outline"
  | "verified"
  | "promo";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning-foreground",
  error: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  outline: "border border-border-default bg-transparent text-foreground",
  verified: "bg-trust-badge-bg text-trust-verified border border-trust-badge-border",
  promo: "bg-accent text-content-on-accent font-semibold",
};

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-muted-foreground",
  primary: "bg-primary",
  secondary: "bg-secondary",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
  info: "bg-info",
  outline: "bg-foreground",
  verified: "bg-trust-verified",
  promo: "bg-accent",
};

export function Badge({
  variant = "default",
  size = "md",
  dot = false,
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {icon && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}

Badge.displayName = "Badge";

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  status: "pending" | "active" | "completed" | "cancelled" | "failed" | "draft";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusMap: Record<StatusBadgeProps["status"], BadgeVariant> = {
  pending: "warning",
  active: "success",
  completed: "primary",
  cancelled: "error",
  failed: "error",
  draft: "default",
};

const statusLabels: Record<StatusBadgeProps["status"], string> = {
  pending: "Pendiente",
  active: "Activo",
  completed: "Completado",
  cancelled: "Cancelado",
  failed: "Fallido",
  draft: "Borrador",
};

export function StatusBadge({ status, size = "md", className, ...props }: StatusBadgeProps) {
  return (
    <Badge variant={statusMap[status]} size={size} className={className} {...props}>
      {statusLabels[status]}
    </Badge>
  );
}

StatusBadge.displayName = "StatusBadge";