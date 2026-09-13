"use client";

import { cn } from "@/lib/utils";
import { Button } from "./Button";
import Link from "next/link";
import {
  ShoppingCart,
  Calendar,
  Package,
  Receipt,
  Search,
  Plus,
  Truck,
  Users,
  Building2,
  Cog,
  Star,
  Heart,
} from "lucide-react";

export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    href?: string;
    variant?: "primary" | "outline" | "secondary";
  };
  className?: string;
}

const defaultIcons: Record<string, React.ReactNode> = {
  cart: <ShoppingCart className="h-12 w-12 text-muted-foreground" />,
  reservations: <Calendar className="h-12 w-12 text-muted-foreground" />,
  products: <Package className="h-12 w-12 text-muted-foreground" />,
  orders: <Receipt className="h-12 w-12 text-muted-foreground" />,
  search: <Search className="h-12 w-12 text-muted-foreground" />,
  logistics: <Truck className="h-12 w-12 text-muted-foreground" />,
  users: <Users className="h-12 w-12 text-muted-foreground" />,
  areas: <Building2 className="h-12 w-12 text-muted-foreground" />,
  settings: <Cog className="h-12 w-12 text-muted-foreground" />,
  favorites: <Heart className="h-12 w-12 text-muted-foreground" />,
  reviews: <Star className="h-12 w-12 text-muted-foreground" />,
};

export function EmptyState({
  title,
  message,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 p-10 text-center rounded-2xl border border-dashed bg-muted/30",
        className
      )}
      aria-live="polite"
    >
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-muted/80">
        {icon ?? defaultIcons.search}
      </div>
      <div className="max-w-sm">
        <h3 className="text-lg font-semibold">{title}</h3>
        {message && (
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
        )}
      </div>
      {action && (
        <Button variant={action.variant ?? "primary"} className="mt-2" asChild={!!action.href}>
          {action.href ? (
            <Link href={action.href}>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              {action.label}
            </Link>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              {action.label}
            </>
          )}
        </Button>
      )}
    </div>
  );
}

EmptyState.displayName = "EmptyState";

export interface EmptyStatePresetProps {
  preset: keyof typeof defaultIcons;
  action?: {
    label: string;
    href?: string;
    variant?: "primary" | "outline" | "secondary";
  };
  className?: string;
}

const presets: Record<keyof typeof defaultIcons, { title: string; message: string }> = {
  cart: { title: "Tu carrito está vacío", message: "Agrega productos o servicios para comenzar tu pedido" },
  reservations: { title: "No tienes reservas", message: "Cuando reserves un servicio, aparecerá aquí" },
  products: { title: "No hay productos disponibles", message: "Agrega tu primer producto para empezar a vender" },
  orders: { title: "No tienes pedidos", message: "Tus pedidos aparecerán aquí una vez confirmados" },
  search: { title: "No se encontraron resultados", message: "Intenta con otros términos de búsqueda o filtros" },
  logistics: { title: "No hay pedidos asignados", message: "Los pedidos asignados a tu proveedor aparecerán aquí" },
  users: { title: "No hay usuarios registrados", message: "Los usuarios aparecerán aquí cuando se registren" },
  areas: { title: "No hay áreas creadas", message: "Crea tu primera área para organizar los negocios" },
  settings: { title: "Sin configuración", message: "Configura las opciones de tu panel" },
  favorites: { title: "No tienes favoritos", message: "Guarda tus productos favoritos para acceder rápidamente" },
  reviews: { title: "Sin reseñas", message: "Las reseñas de tus productos aparecerán aquí" },
};

export function EmptyStatePreset({
  preset,
  action,
  className,
}: EmptyStatePresetProps) {
  const { title, message } = presets[preset];

  return (
    <EmptyState
      title={title}
      message={message}
      icon={defaultIcons[preset]}
      action={action}
      className={className}
    />
  );
}

EmptyStatePreset.displayName = "EmptyStatePreset";
