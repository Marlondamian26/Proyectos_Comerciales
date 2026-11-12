"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Rol } from "@/lib/auth/roles";
import { isDashboardNavigationRoute } from "@/lib/navigation/dashboard-routes";
import { Sidebar } from "@/components/Sidebar";
import { NegocioMobileDrawer } from "@/components/negocio/NegocioMobileDrawer";

interface DashboardChromeProps {
  children: ReactNode;
  userRol?: Rol;
}

export function DashboardChrome({ children, userRol }: DashboardChromeProps) {
  const pathname = usePathname();
  const showDashboardChrome =
    Boolean(userRol) && isDashboardNavigationRoute(pathname);

  if (!showDashboardChrome || !userRol) {
    return children;
  }

  const isBusinessRoute =
    pathname === "/negocio" || pathname.startsWith("/negocio/");
  const useNegocioNavigation = userRol === Rol.NEGOCIO;
  const isRoleDashboard = ["/cliente", "/logistica", "/admin"].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const contentClassName = isBusinessRoute
    ? "p-6"
    : isRoleDashboard
      ? "p-4 pb-24 sm:p-6 lg:pb-6"
      : "";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] min-w-0 flex-1">
      {useNegocioNavigation ? (
        <NegocioMobileDrawer key={pathname} />
      ) : (
        <Sidebar key={pathname} userRol={userRol} />
      )}
      <div className={contentClassName} data-testid="dashboard-content">
        {children}
      </div>
    </div>
  );
}
