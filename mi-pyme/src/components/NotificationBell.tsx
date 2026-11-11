"use client";

import { cn } from "@/lib/utils";
import { Bell, BellDot } from "lucide-react";
import Link from "next/link";
import * as React from "react";

export interface NotificationBellProps {
  count?: number;
  unreadCount?: number;
  onClick?: () => void;
  href?: string;
  className?: string;
  disabled?: boolean;
}

export function NotificationBell({
  count = 0,
  unreadCount,
  onClick,
  href,
  className,
  disabled = false,
}: NotificationBellProps) {
  const total = unreadCount ?? count;

  const renderBell = () => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={
        total > 0
          ? `${total} notificaciones sin leer`
          : "Sin notificaciones nuevas"
      }
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full",
        "text-secondary transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "active:scale-[0.95]",
        !disabled && total > 0 && "text-primary hover:bg-muted/50",
        !disabled && total === 0 && "hover:bg-muted/30",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {total > 0 ? (
        <BellDot
          className={cn(
            "h-5 w-5",
            total > 0 && "text-primary"
          )}
          aria-hidden="true"
        />
      ) : (
        <Bell className="h-5 w-5" aria-hidden="true" />
      )}

      {total > 0 && (
        <span
          className={cn(
            "absolute -top-1 -right-1",
            "flex h-5 min-w-[20px] items-center justify-center",
            "rounded-full bg-destructive px-1 text-[10px] font-bold",
            "text-content-inverse",
            "animate-pulse",
            "whitespace-nowrap"
          )}
          aria-label={`${total} notificaciones sin leer`}
        >
          {total > 99 ? "99+" : total}
        </span>
      )}

      {total > 0 && (
        <span
          className="absolute inset-0 rounded-full bg-primary/20"
          style={{
            animation: "pulse 1.5s ease-in-out infinite",
          }}
          aria-hidden="true"
        />
      )}
    </button>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className="inline-block">
        {renderBell()}
      </Link>
    );
  }

  return renderBell();
}

NotificationBell.displayName = "NotificationBell";