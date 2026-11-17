"use client";

import { Image as ImageIcon, ShoppingBag, Truck, Store, Wrench, Package } from "lucide-react";

type CardType = "producto" | "servicio" | "negocio" | "envio" | "combo" | "default";

interface CardImageFallbackProps {
  tipo?: CardType;
  nombre?: string;
  className?: string;
}

const ICONS: Record<CardType, React.ComponentType<{ className?: string }>> = {
  producto: Package,
  servicio: Wrench,
  negocio: Store,
  envio: Truck,
  combo: ShoppingBag,
  default: ImageIcon,
};

const GRADIENTS: Record<CardType, string> = {
  producto: "from-blue-500/20 via-blue-400/10 to-cyan-500/20 dark:from-blue-500/30 dark:via-blue-400/20 dark:to-cyan-500/30",
  servicio: "from-purple-500/20 via-purple-400/10 to-pink-500/20 dark:from-purple-500/30 dark:via-purple-400/20 dark:to-pink-500/30",
  negocio: "from-emerald-500/20 via-emerald-400/10 to-teal-500/20 dark:from-emerald-500/30 dark:via-emerald-400/20 dark:to-teal-500/30",
  envio: "from-orange-500/20 via-orange-400/10 to-amber-500/20 dark:from-orange-500/30 dark:via-orange-400/20 dark:to-amber-500/30",
  combo: "from-rose-500/20 via-rose-400/10 to-red-500/20 dark:from-rose-500/30 dark:via-rose-400/20 dark:to-red-500/30",
  default: "from-gray-500/20 via-gray-400/10 to-slate-500/20 dark:from-gray-500/30 dark:via-gray-400/20 dark:to-slate-500/30",
};

const LABELS: Record<CardType, string> = {
  producto: "Producto",
  servicio: "Servicio",
  negocio: "Negocio",
  envio: "Envío",
  combo: "Combo",
  default: "",
};

export function CardImageFallback({ tipo = "default", nombre, className = "" }: CardImageFallbackProps) {
  const Icon = ICONS[tipo];
  const gradient = GRADIENTS[tipo];
  const label = LABELS[tipo];

  return (
    <div
      data-testid="card-fallback"
      className={`relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${gradient} ${className}`}
    >
      <Icon className="h-12 w-12 text-foreground/40 mb-2" />
      {label && (
        <span className="text-xs font-medium text-foreground/60 uppercase tracking-wide">
          {label}
        </span>
      )}
      {nombre && (
        <span className="text-sm font-medium text-foreground/70 mt-1 px-4 text-center line-clamp-2">
          {nombre}
        </span>
      )}
    </div>
  );
}
