"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Rol } from "@/lib/auth/roles";
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
    allowedRoles: [Rol.CLIENTE],
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
    label: "Solicitar ser negocio",
    href: "/solicitar-rol",
    icon: <BuildingIcon className="h-5 w-5" />,
    allowedRoles: [Rol.CLIENTE],
    requiresNoPendingRoleRequest: true,
  },
  {
    label: "Mis solicitudes de rol",
    href: "/solicitar-rol/estado",
    icon: <UserIcon className="h-5 w-5" />,
    allowedRoles: [Rol.CLIENTE, Rol.NEGOCIO, Rol.LOGISTICA],
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
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    } catch {
      // localStorage no disponible (modo incógnito, etc.)
    }
  }, [collapsed]);

  const toggle = () => setCollapsed((prev) => !prev);

  const visibleItems = sidebarItems.filter(
    (item) =>
      (
        item.allowedRoles.length === 0 ||
        (userRol && item.allowedRoles.includes(userRol)) ||
        (item.requiresNegocioOwnership && esDuenoDeNegocio)
      ) &&
      (!item.requiresNoPendingRoleRequest || !tieneSolicitudPendiente)
  );

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-background transition-[width] duration-300 ease-out",
        collapsed ? "w-16" : "w-64"
      )}
      aria-label="Navegación principal"
    >
      <button
        onClick={toggle}
        className={cn(
          "absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center",
          "rounded-full border bg-background shadow-subtle hover:bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        aria-expanded={!collapsed}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <nav className="flex-1 overflow-y-auto py-4" aria-label="Menú de panel">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const href = item.href.split("?")[0];
            const isActive =
              pathname === href || pathname.startsWith(href + "?");
            return (
              <NavItem
                key={item.href}
                item={item}
                collapsed={collapsed}
                isActive={isActive}
              />
            );
          })}
        </ul>
      </nav>
    </aside>
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
          "hover:bg-muted hover:text-foreground dark:hover:bg-white dark:hover:text-secondary-300",
          isActive
            ? "bg-muted text-foreground"
            : "text-muted-foreground",
          collapsed ? "justify-center px-2" : ""
        )}
        aria-current={isActive ? "page" : undefined}
        aria-label={collapsed ? item.label : undefined}
      >
        <span className="flex-shrink-0" aria-hidden="true">
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
