"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Clock,
  Package,
  Scissors,
  Warehouse,
  Calendar,
  Truck,
  ShoppingCart,
  CalendarCheck,
  TrendingUp,
  User,
  CreditCard,
  FileText,
  Receipt,
} from "lucide-react";

export interface NegocioSidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const negocioSidebarItems: NegocioSidebarItem[] = [
  { label: "Resumen", href: "/negocio", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Mi negocio", href: "/negocio/mi-negocio", icon: <Building2 className="h-5 w-5" /> },
  { label: "Datos fiscales", href: "/negocio/mi-negocio#datos-fiscales", icon: <FileText className="h-5 w-5" /> },
  { label: "Mis facturas", href: "/negocio/facturas", icon: <Receipt className="h-5 w-5" /> },
  { label: "Horarios", href: "/negocio/horarios", icon: <Clock className="h-5 w-5" /> },
  { label: "Productos", href: "/negocio/productos", icon: <Package className="h-5 w-5" /> },
  { label: "Servicios", href: "/negocio/servicios", icon: <Scissors className="h-5 w-5" /> },
  { label: "Inventario", href: "/negocio/inventario", icon: <Warehouse className="h-5 w-5" /> },
  { label: "Disponibilidad", href: "/negocio/disponibilidad", icon: <Calendar className="h-5 w-5" /> },
  { label: "Logística", href: "/negocio/logistica", icon: <Truck className="h-5 w-5" /> },
  { label: "Pedidos", href: "/negocio/pedidos", icon: <ShoppingCart className="h-5 w-5" /> },
  { label: "Pagos", href: "/negocio/pagos", icon: <CreditCard className="h-5 w-5" /> },
  { label: "Reservas", href: "/negocio/reservas", icon: <CalendarCheck className="h-5 w-5" /> },
  { label: "Ventas", href: "/negocio/ventas", icon: <TrendingUp className="h-5 w-5" /> },
  { label: "Perfil", href: "/perfil", icon: <User className="h-5 w-5" /> },
];

export interface NegocioSidebarProps {
  userRol?: string;
}

export function NegocioSidebar({ userRol }: NegocioSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-screen min-w-[240px] flex-col gap-y-1 overflow-y-auto border-r bg-background p-4"
      role="complementary"
      aria-label="Navegación del panel de negocio"
    >
      <nav className="space-y-1" aria-label="Menú de negocio">
        {negocioSidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                "hover:bg-muted hover:text-foreground",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="flex-shrink-0" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

NegocioSidebar.displayName = "NegocioSidebar";
