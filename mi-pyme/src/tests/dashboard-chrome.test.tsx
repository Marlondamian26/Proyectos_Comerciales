import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import Link from "next/link";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardChrome } from "@/components/DashboardChrome";

const routeState = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => routeState.pathname,
}));

vi.mock("@/components/Sidebar", () => ({
  Sidebar: () => <aside data-testid="role-sidebar" />,
}));

vi.mock("@/components/negocio/NegocioMobileDrawer", () => ({
  NegocioMobileDrawer: () => <aside data-testid="business-sidebar" />,
}));

vi.mock("@/components/ui/BackToHome", () => ({
  BackToHome: () => (
    <Link href="/" data-testid="back-to-home">
      Volver al inicio
    </Link>
  ),
}));

vi.mock("@/components/LogoutButton", () => ({
  LogoutButton: () => <button>Cerrar sesión</button>,
}));

describe("DashboardChrome", () => {
  beforeEach(() => {
    routeState.pathname = "/";
  });

  it("shows role navigation and dashboard actions on shared protected views", () => {
    routeState.pathname = "/pedidos";
    const { getByTestId, getByRole } = render(
      <DashboardChrome userRol="CLIENTE">
        <div>Pedidos</div>
      </DashboardChrome>
    );

    expect(getByTestId("role-sidebar")).toBeInTheDocument();
    expect(getByTestId("dashboard-toolbar")).toContainElement(
      getByTestId("back-to-home")
    );
    expect(getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  });

  it("uses the business navigation on business dashboard routes", () => {
    routeState.pathname = "/negocio/productos";
    const { getByTestId, queryByTestId } = render(
      <DashboardChrome userRol="NEGOCIO">
        <div>Productos</div>
      </DashboardChrome>
    );

    expect(getByTestId("business-sidebar")).toBeInTheDocument();
    expect(queryByTestId("role-sidebar")).not.toBeInTheDocument();
    expect(getByTestId("dashboard-content")).toHaveClass("p-6");
  });

  it("uses business navigation on shared protected views for business users", () => {
    routeState.pathname = "/pedidos";
    const { getByTestId, queryByTestId } = render(
      <DashboardChrome userRol="NEGOCIO">
        <div>Pedidos</div>
      </DashboardChrome>
    );

    expect(getByTestId("business-sidebar")).toBeInTheDocument();
    expect(queryByTestId("role-sidebar")).not.toBeInTheDocument();
    expect(getByTestId("dashboard-content")).not.toHaveClass("p-6");
  });

  it("does not add dashboard navigation to public routes", () => {
    routeState.pathname = "/catalogo";
    const { queryByTestId } = render(
      <DashboardChrome userRol="CLIENTE">
        <div>Catálogo</div>
      </DashboardChrome>
    );

    expect(queryByTestId("role-sidebar")).not.toBeInTheDocument();
    expect(queryByTestId("dashboard-toolbar")).not.toBeInTheDocument();
  });
});
