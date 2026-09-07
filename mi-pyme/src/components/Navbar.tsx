import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rol } from "@/lib/auth/roles";

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  allowedRoles?: Rol[];
}

const navItems: NavItem[] = [
  { label: "Inicio", href: "/", icon: "🏠", allowedRoles: [] },
  { label: "Catálogo", href: "/catalogo", icon: "🛍️", allowedRoles: [] },
  { label: "Carrito", href: "/carrito", icon: "🛒", allowedRoles: [Rol.CLIENTE] },
  { label: "Reservas", href: "/reservas", icon: "📅", allowedRoles: [Rol.CLIENTE] },
  {
    label: "Pedidos",
    href: "/pedidos",
    icon: "📦",
    allowedRoles: [Rol.CLIENTE, Rol.NEGOCIO, Rol.LOGISTICA],
  },
  {
    label: "Facturas",
    href: "/facturas",
    icon: "🧾",
    allowedRoles: [Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN],
  },
  {
    label: "Cliente",
    href: "/cliente",
    icon: "👤",
    allowedRoles: [Rol.CLIENTE],
  },
  {
    label: "Negocio",
    href: "/negocio",
    icon: "🏢",
    allowedRoles: [Rol.NEGOCIO, Rol.ADMIN],
  },
  {
    label: "Logística",
    href: "/logistica",
    icon: "🚚",
    allowedRoles: [Rol.LOGISTICA, Rol.ADMIN],
  },
  {
    label: "Admin",
    href: "/admin",
    icon: "⚙️",
    allowedRoles: [Rol.ADMIN],
  },
];

export interface NavbarProps {
  userRol?: Rol;
}

export function Navbar({ userRol }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav
      className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      aria-label="Navegación principal"
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-xl font-bold"
            aria-label="Mi-Pyme - Inicio"
          >
            Mi-Pyme
          </Link>
          <ul className="flex items-center gap-2">
            {navItems
              .filter(
                (item) =>
                  !item.allowedRoles ||
                  item.allowedRoles.length === 0 ||
                  (userRol && item.allowedRoles.includes(userRol))
              )
              .map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      "hover:bg-muted hover:text-muted-foreground",
                      pathname === item.href
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground"
                    )}
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    <span className="mr-2" aria-hidden="true">
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}

Navbar.displayName = "Navbar";
