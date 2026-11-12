"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
  Percent,
  Tag,
  PackageOpen,
  X,
  ChevronLeft,
  ChevronRight,
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
  { label: "Promociones", href: "/negocio/promociones", icon: <Percent className="h-5 w-5" /> },
  { label: "Cupones", href: "/negocio/cupones", icon: <Tag className="h-5 w-5" /> },
  { label: "Combos", href: "/negocio/combos", icon: <PackageOpen className="h-5 w-5" /> },
  { label: "Ventas", href: "/negocio/ventas", icon: <TrendingUp className="h-5 w-5" /> },
  { label: "Perfil", href: "/perfil", icon: <User className="h-5 w-5" /> },
];

export interface NegocioSidebarProps {
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

const SIDEBAR_COLLAPSED_KEY = "mi-pyme-negocio-sidebar-collapsed";

export function NegocioSidebar({
  mobileOpen: propMobileOpen,
  onMobileOpenChange: propOnMobileOpenChange,
}: NegocioSidebarProps) {
  const pathname = usePathname();
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });
  const mobileOpen = propMobileOpen ?? internalMobileOpen;
  const setMobileOpen = (open: boolean) => {
    setInternalMobileOpen(open);
    propOnMobileOpenChange?.(open);
  };

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    } catch {
      // localStorage no disponible (modo incógnito, etc.)
    }
  }, [collapsed]);

  const toggle = () => setCollapsed((prev) => !prev);

  const handleItemClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "relative hidden min-h-full flex-col flex-shrink-0 border-r border-sidebar-border/50 bg-sidebar/35 dark:bg-sidebar/55 backdrop-blur-lg transition-[width] duration-300 ease-out lg:flex",
          collapsed ? "w-20" : "w-64"
        )}
        role="complementary"
        aria-label="Navegación del panel de negocio"
      >
        <button
          onClick={toggle}
          className={cn(
            "absolute -right-3 top-6 z-10 flex h-11 w-11 items-center justify-center",
            "rounded-full border bg-background shadow-subtle hover:bg-muted",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <nav className="flex-1 overflow-y-auto py-4 space-y-1" aria-label="Menú de negocio">
          {negocioSidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                  "hover:bg-muted hover:text-foreground",
                  collapsed ? "justify-center px-2" : "",
                  isActive ? "bg-muted text-foreground" : "text-muted-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
                onClick={handleItemClick}
              >
                <span className="flex-shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside id="negocio-sidebar-mobile" className="
            fixed inset-y-0 left-0 z-50 w-72
            bg-sidebar/35 dark:bg-sidebar/55 backdrop-blur-lg border-r border-sidebar-border/50 shadow-xl overflow-y-auto
            lg:hidden transform transition-transform duration-300 ease-in-out
            translate-x-0
          ">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Negocio</h2>
              <button
                onClick={() => setMobileOpen(false)}
                className="h-11 w-11 inline-flex items-center justify-center rounded-lg hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 space-y-1" aria-label="Menú de negocio">
              {negocioSidebarItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors duration-150 block",
                      "hover:bg-muted hover:text-foreground",
                      isActive ? "bg-muted text-foreground" : "text-muted-foreground"
                    )}
                    aria-current={isActive ? "page" : undefined}
                    onClick={handleItemClick}
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
        </>
      )}
    </>
  );
}

NegocioSidebar.displayName = "NegocioSidebar";
