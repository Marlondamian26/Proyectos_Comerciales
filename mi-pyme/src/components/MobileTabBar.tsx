"use client";

import { cn } from "@/lib/utils";
import {
  Home,
  ShoppingBag,
  Package,
  User,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export interface MobileTabBarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | string;
  exact?: boolean;
}

export interface MobileTabBarProps {
  items?: MobileTabBarItem[];
  className?: string;
  showLabels?: boolean;
}

const defaultClienteItems: MobileTabBarItem[] = [
  {
    label: "Inicio",
    href: "/cliente",
    icon: <Home className="h-5 w-5" />,
    exact: true,
  },
  {
    label: "Catálogo",
    href: "/catalogo",
    icon: <ShoppingBag className="h-5 w-5" />,
  },
  {
    label: "Carrito",
    href: "/carrito",
    icon: <ShoppingCart className="h-5 w-5" />,
    badge: 0,
  },
  {
    label: "Pedidos",
    href: "/pedidos",
    icon: <Package className="h-5 w-5" />,
  },
  {
    label: "Perfil",
    href: "/perfil",
    icon: <User className="h-5 w-5" />,
  },
];

export function MobileTabBar({
  items = defaultClienteItems,
  className,
  showLabels = true,
}: MobileTabBarProps) {
  const [activePath, setActivePath] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActivePath(window.location.pathname);
    }
  }, []);

  const isActive = (item: MobileTabBarItem) => {
    if (item.exact) {
      return activePath === item.href;
    }
    return activePath.startsWith(item.href);
  };

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-sticky",
        "flex items-center justify-around",
        "bg-surface-elevated border-t border-border-subtle",
        "md:hidden",
        "safe-area-inset-bottom",
        "pb-[calc(env(safe-area-inset-bottom,0rem)+0.75rem)]",
        className
      )}
      aria-label="Navegación principal"
    >
      <div className="flex items-center justify-around w-full">
        {items.map((item) => {
          const active = isActive(item);
          const hasBadge = item.badge !== undefined && item.badge !== 0 && item.badge !== "";

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center",
                "min-w-[44px] min-h-[44px] min-h-[44px]",
                "px-1 py-1.5 rounded-lg transition-all duration-200",
                active
                  ? "text-primary bg-primary/10"
                  : "text-secondary hover:text-primary hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "relative flex items-center justify-center",
                  "transition-transform duration-200",
                  active && "scale-110"
                )}
                aria-hidden={active}
              >
                {item.icon}
                {hasBadge && (
                  <span
                    className={cn(
                      "absolute -top-1 -right-1",
                      "flex h-5 min-w-[20px] items-center justify-center",
                      "rounded-full bg-destructive px-1 text-[10px] font-bold",
                      "text-content-inverse",
                      "whitespace-nowrap"
                    )}
                    aria-label={
                      typeof item.badge === "number"
                        ? `${item.badge} elementos sin leer`
                        : String(item.badge)
                    }
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              {showLabels && (
                <span
                  className={cn(
                    "mt-0.5 text-xs font-medium",
                    active ? "text-primary" : "text-secondary"
                  )}
                >
                  {item.label}
                </span>
              )}
              {active && (
                <span
                  className="absolute -bottom-1 h-1 w-5 rounded-full bg-primary"
                  aria-current="step"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

MobileTabBar.displayName = "MobileTabBar";