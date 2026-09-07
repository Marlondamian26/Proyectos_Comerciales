import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rol } from "@/lib/auth/roles";
import {
  HomeIcon,
  ShoppingCartIcon,
  CalendarIcon,
  PackageIcon,
  ReceiptIcon,
  UsersIcon,
  BuildingIcon,
  TruckIcon,
  CogIcon,
} from "lucide-react";

export interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  allowedRoles: Rol[];
}

const sidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: <HomeIcon className="h-5 w-5" />,
    allowedRoles: [],
  },
  {
    label: "Productos",
    href: "/negocio",
    icon: <PackageIcon className="h-5 w-5" />,
    allowedRoles: [Rol.NEGOCIO, Rol.ADMIN],
  },
  {
    label: "Inventario",
    href: "/negocio?tab=inventario",
    icon: <PackageIcon className="h-5 w-5" />,
    allowedRoles: [Rol.NEGOCIO, Rol.ADMIN],
  },
  {
    label: "Pedidos",
    href: "/pedidos",
    icon: <ShoppingCartIcon className="h-5 w-5" />,
    allowedRoles: [Rol.CLIENTE, Rol.NEGOCIO, Rol.LOGISTICA],
  },
  {
    label: "Facturas",
    href: "/facturas",
    icon: <ReceiptIcon className="h-5 w-5" />,
    allowedRoles: [Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN],
  },
  {
    label: "Reservas",
    href: "/reservas",
    icon: <CalendarIcon className="h-5 w-5" />,
    allowedRoles: [Rol.CLIENTE],
  },
  {
    label: "Carrito",
    href: "/carrito",
    icon: <ShoppingCartIcon className="h-5 w-5" />,
    allowedRoles: [Rol.CLIENTE],
  },
  {
    label: "Proveedores",
    href: "/logistica",
    icon: <TruckIcon className="h-5 w-5" />,
    allowedRoles: [Rol.LOGISTICA, Rol.ADMIN],
  },
  {
    label: "Usuarios",
    href: "/admin?tab=usuarios",
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
];

export interface SidebarProps {
  userRol?: Rol;
}

export function Sidebar({ userRol }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-screen min-w-[240px] flex-col gap-y-2 overflow-y-auto border-r bg-background p-4"
      aria-label="Navegación lateral"
    >
      <nav className="space-y-1" aria-label="Menú de panel">
        {sidebarItems
          .filter(
            (item) =>
              item.allowedRoles.length === 0 ||
              (userRol && item.allowedRoles.includes(userRol))
          )
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "hover:bg-muted hover:text-muted-foreground",
                pathname === item.href ||
                  pathname.startsWith(item.href.split("?")[0])
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground"
              )}
              aria-current={
                pathname === item.href.split("?")[0] ? "page" : undefined
              }
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
      </nav>
    </aside>
  );
}

Sidebar.displayName = "Sidebar";
