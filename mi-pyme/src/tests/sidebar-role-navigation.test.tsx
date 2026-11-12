import { fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "@/components/Sidebar";
import { NegocioSidebar } from "@/components/negocio/NegocioSidebar";
import { Rol } from "@/lib/auth/roles";

const routeState = vi.hoisted(() => ({ pathname: "/admin", search: "" }));

vi.mock("next/navigation", () => ({
  usePathname: () => routeState.pathname,
  useSearchParams: () => new URLSearchParams(routeState.search),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("role sidebar navigation", () => {
  beforeEach(() => {
    routeState.pathname = "/admin";
    routeState.search = "";
  });

  it.each([
    [Rol.CLIENTE, "/cliente"],
    [Rol.NEGOCIO, "/negocio"],
    [Rol.LOGISTICA, "/logistica"],
    [Rol.ADMIN, "/admin"],
  ])("routes Resumen for %s to its dashboard", (role, dashboardPath) => {
    const { getByRole } = render(<Sidebar userRol={role} />);

    expect(getByRole("link", { name: "Resumen" })).toHaveAttribute(
      "href",
      dashboardPath
    );
  });

  it("shows the cart to CLIENTE and ADMIN, but not to operational roles", () => {
    const adminView = render(<Sidebar userRol={Rol.ADMIN} />);
    expect(adminView.getByRole("link", { name: "Carrito" })).toBeInTheDocument();
    adminView.unmount();

    const logisticsView = render(<Sidebar userRol={Rol.LOGISTICA} />);
    expect(
      logisticsView.queryByRole("link", { name: "Carrito" })
    ).not.toBeInTheDocument();
    expect(
      logisticsView.queryByRole("link", { name: "Proveedores" })
    ).not.toBeInTheDocument();
  });

  it("uses the same tokenized dark-theme styles for admin Áreas and Configuración", () => {
    const { getByRole } = render(<Sidebar userRol={Rol.ADMIN} />);
    const areaLink = getByRole("link", { name: "Áreas" });
    const settingsLink = getByRole("link", { name: "Configuración" });

    expect(areaLink.className).toBe(settingsLink.className);
    expect(areaLink.className).toContain("text-muted-foreground");
    expect(areaLink.className).toContain("hover:bg-sidebar-item-hover");
  });

  it("marks only the selected admin tab as active", () => {
    routeState.search = "?tab=areas";
    const { getByRole } = render(<Sidebar userRol={Rol.ADMIN} />);

    expect(getByRole("link", { name: "Áreas" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(
      getByRole("link", { name: "Configuración" })
    ).not.toHaveAttribute("aria-current", "page");
    expect(
      getByRole("link", { name: "Resumen" })
    ).not.toHaveAttribute("aria-current", "page");
  });

  it("uses translucent surfaces for both role-specific sidebars", () => {
    const regularSidebar = render(<Sidebar userRol={Rol.CLIENTE} />);
    expect(
      regularSidebar.getByRole("complementary", {
        name: "Navegación principal",
      }).className
    ).toContain("bg-sidebar/35");
    fireEvent.click(
      regularSidebar.getByRole("button", { name: "Abrir menú del panel" })
    );
    expect(
      regularSidebar.getByRole("complementary", {
        name: "Menú móvil del panel",
      }).className
    ).toContain("bg-sidebar/55");
    regularSidebar.unmount();

    const negocioSidebar = render(<NegocioSidebar mobileOpen />);
    expect(
      negocioSidebar.getByRole("complementary", {
        name: "Navegación del panel de negocio",
      }).className
    ).toContain("bg-sidebar/35");
    expect(
      negocioSidebar.container.querySelector("#negocio-sidebar-mobile")?.className
    ).toContain("bg-sidebar/55");
  });
});
