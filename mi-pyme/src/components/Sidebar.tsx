"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Rol } from "@/lib/auth/roles";
import { getDashboardPath } from "@/lib/auth/dashboard-paths";
import {
  HomeIcon,
  ShoppingCartIcon,
  CalendarIcon,
  PackageIcon,
  ReceiptIcon,
  CreditCardIcon,
  UsersIcon,
  BuildingIcon,
  TruckIcon,
  CogIcon,
  UserIcon,
  FileBarChartIcon,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

export interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  allowedRoles: Rol[];
  requiresNegocioOwnership?: boolean;
  requiresNoPendingRoleRequest?: boolean;
}

export const sidebarItems: SidebarItem[] = [
  {
    label: "Resumen",
    href: "/",
    icon: <HomeIcon className="h-5 w-5" />,
    allowedRoles: [],
  },
  {
    label: "Catálogo",
    href: "/catalogo",
    icon: <PackageIcon className="h-5 w-5" />,
    allowedRoles: [],
  },
  {
    label: "Carrito",
    href: "/carrito",
    icon: <ShoppingCartIcon className="h-5 w-5" />,
    allowedRoles: [Rol.CLIENTE, Rol.ADMIN],
  },
  {
    label: "Pedidos",
    href: "/pedidos",
    icon: <ShoppingCartIcon className="h-5 w-5" />,
    allowedRoles: [Rol.CLIENTE, Rol.NEGOCIO, Rol.LOGISTICA],
  },
  {
    label: "Reservas",
    href: "/reservas",
    icon: <CalendarIcon className="h-5 w-5" />,
    allowedRoles: [Rol.CLIENTE],
  },
  {
    label: "Facturas",
    href: "/facturas",
    icon: <ReceiptIcon className="h-5 w-5" />,
    allowedRoles: [Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN],
  },
  {
    label: "Pagos",
    href: "/pagos",
    icon: <CreditCardIcon className="h-5 w-5" />,
    allowedRoles: [Rol.CLIENTE, Rol.ADMIN],
  },
  {
    label: "Proveedores",
    href: "/logistica",
    icon: <TruckIcon className="h-5 w-5" />,
    allowedRoles: [Rol.LOGISTICA, Rol.ADMIN],
  },
  {
    label: "Solicitudes de rol",
    href: "/admin/solicitudes-rol",
    icon: <CogIcon className="h-5 w-5" />,
    allowedRoles: [Rol.ADMIN],
  },

  {
    label: "Usuarios",
    href: "/admin/usuarios",
    icon: <UsersIcon className="h-5 w-5" />,
    allowedRoles: [Rol.ADMIN],
  },
  {
    label: "Áreas",
    href: "/admin?tab=areas",
    icon: <BuildingIcon className="h-5 w-5" />,
    allowedRoles: [Rol.ADMIN],
  },
  {
    label: "Configuración",
    href: "/admin?tab=config",
    icon: <CogIcon className="h-5 w-5" />,
    allowedRoles: [Rol.ADMIN],
  },
  {
    label: "Reporte fiscal",
    href: "/admin/reportes/fiscal",
    icon: <FileBarChartIcon className="h-5 w-5" />,
    allowedRoles: [Rol.ADMIN],
  },
  {
    label: "Mi perfil",
    href: "/perfil",
    icon: <UserIcon className="h-5 w-5" />,
    allowedRoles: [Rol.CLIENTE, Rol.NEGOCIO, Rol.LOGISTICA, Rol.ADMIN],
  },
];

export interface SidebarProps {
  userRol?: Rol;
  esDuenoDeNegocio?: boolean;
  tieneSolicitudPendiente?: boolean;
}

const SIDEBAR_COLLAPSED_KEY = "mi-pyme-sidebar-collapsed";

export function Sidebar({
  userRol,
  esDuenoDeNegocio,
  tieneSolicitudPendiente = false,
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Aplicar estado de localStorage SOLO después de montar (evita hydration mismatch)
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored !== null) {
        setCollapsed(stored === "true");
      }
    } catch {
      // localStorage no disponible (modo incógnito, etc.)
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    } catch {
      // localStorage no disponible (modo incógnito, etc.)
    }
  }, [collapsed]);

  // Bloquear scroll del body cuando el drawer móvil está abierto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [mobileOpen]);

  const toggle = () => setCollapsed((prev) => !prev);

  const dashboardPath = userRol ? getDashboardPath(userRol) : "/";
  const visibleItems = sidebarItems
    .map((item) =>
      item.label === "Resumen" ? { ...item, href: dashboardPath } : item
    )
    .filter(
      (item) =>
        (
          item.allowedRoles.length === 0 ||
          (userRol && item.allowedRoles.includes(userRol)) ||
          (item.requiresNegocioOwnership && esDuenoDeNegocio)
        ) &&
        !(userRol === Rol.LOGISTICA && item.label === "Proveedores") &&
        (!item.requiresNoPendingRoleRequest || !tieneSolicitudPendiente)
    );

  const isItemActive = (item: SidebarItem) => {
    const [href, query] = item.href.split("?");
    const hasQuery = Boolean(query);
    const pathMatches =
      pathname === href ||
      (!hasQuery &&
        item.label !== "Resumen" &&
        pathname.startsWith(`${href}/`));
    if (!pathMatches) return false;

    const requiredParams = new URLSearchParams(query ?? "");
    const queryMatches = [...requiredParams].every(
      ([key, value]) => searchParams.get(key) === value
    );
    const adminTabSelected =
      userRol === Rol.ADMIN &&
      item.label === "Resumen" &&
      searchParams.has("tab");

    return queryMatches && !adminTabSelected;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen((open) => !open)}
        className={cn(
          "fixed top-12 left-4 z-[60] inline-flex h-11 w-11 items-center justify-center rounded-lg bg-background/80 text-foreground shadow-sm backdrop-blur-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        )}
        aria-label={mobileOpen ? "Cerrar menú del panel" : "Abrir menú del panel"}
        aria-expanded={mobileOpen}
        aria-controls="dashboard-sidebar-mobile"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Desktop sidebar con toggle al lado */}
      <div className="relative hidden lg:block">
        <aside
          className={cn(
            "flex min-h-full flex-col flex-shrink-0 border-r border-sidebar-border/50 bg-sidebar/35 dark:bg-sidebar/55 backdrop-blur-lg transition-[width] duration-300 ease-out",
            collapsed ? "w-20" : "w-64"
          )}
          aria-label="Navegación principal"
        >
          <nav className="flex-1 overflow-y-auto py-4" aria-label="Menú de panel">
            <ul className="space-y-1">
              {visibleItems.map((item) => {
                return (
                  <NavItem
                    key={item.label}
                    item={item}
                    collapsed={mounted ? collapsed : false}
                    isActive={isItemActive(item)}
                  />
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Botón de toggle - fuera del sidebar, al lado derecho */}
        <button
          type="button"
          onClick={toggle}
          className={cn(
            "absolute left-full top-6 z-10 h-10 w-10 -translate-x-1/2 rounded-full transition-transform",
            "bg-sidebar border border-sidebar-border shadow-sm",
            "flex items-center justify-center",
            "hover:bg-surface-raised",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside id="dashboard-sidebar-mobile" className="
            fixed inset-y-0 left-0 z-50 w-72
            bg-sidebar/35 dark:bg-sidebar/55 backdrop-blur-lg border-r border-sidebar-border/50 shadow-xl overflow-y-auto
            lg:hidden transform transition-transform duration-300 ease-in-out
            translate-x-0
            pb-[env(safe-area-inset-bottom)]
          " aria-label="Menú móvil del panel">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Menú</h2>
              <button
                onClick={() => setMobileOpen(false)}
                className="h-11 w-11 inline-flex items-center justify-center rounded-lg hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4" aria-label="Menú de panel">
              <ul className="space-y-1">
                {visibleItems.map((item) => {
                  return (
                    <NavItem
                      key={item.label}
                      item={item}
                      collapsed={false}
                      isActive={isItemActive(item)}
                    />
                  );
                })}
              </ul>
            </nav>
          </aside>
        </>
      )}
    </>
  );
}

function NavItem({
  item,
  collapsed,
  isActive,
}: {
  item: SidebarItem;
  collapsed: boolean;
  isActive: boolean;
}) {
  return (
    <div className="relative group">
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
          "hover:bg-sidebar-item-hover hover:text-foreground",
          isActive
            ? "bg-muted text-foreground"
            : "text-muted-foreground",
          collapsed ? "justify-center px-2" : ""
        )}
        aria-current={isActive ? "page" : undefined}
        aria-label={collapsed ? item.label : undefined}
      >
        <span
          className={cn(
            "flex-shrink-0 text-sidebar-icon group-hover:text-foreground",
            isActive && "text-sidebar-icon-active"
          )}
          aria-hidden="true"
        >
          {item.icon}
        </span>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>

      {collapsed && (
        <div
          role="tooltip"
          className={cn(
            "absolute left-full ml-2 top-1/2 -translate-y-1/2 z-[1100]",
            "hidden group-hover:block group-focus-within:block",
            "px-3 py-1.5 rounded-md bg-popover text-popover-foreground",
            "text-sm whitespace-nowrap shadow-medium pointer-events-none"
          )}
        >
          {item.label}
        </div>
      )}
    </div>
  );
}

Sidebar.displayName = "Sidebar";
