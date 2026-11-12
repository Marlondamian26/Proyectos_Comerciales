import { fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Navbar } from "@/components/Navbar";
import { AuthAwareNavbar } from "@/components/Navbar/AuthAwareNavbar";
import HomePage from "@/app/page";
import { Rol } from "@/lib/auth/roles";

const mockState = vi.hoisted(() => ({
  session: null as null | { user: { name: string; email: string; rol: string } },
  homeSession: null as null | { user: { rol: string } },
  pathname: "/",
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => mockState.homeSession),
}));

vi.mock("@/lib/actions", () => ({
  listarAreas: vi.fn().mockResolvedValue([]),
  listarNegocios: vi.fn().mockResolvedValue([]),
  listarServicios: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/db/prisma", () => ({
  default: {
    heroImage: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock("@/components/SortControls", () => ({
  SortControls: () => null,
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockState.session }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockState.pathname,
}));

vi.mock("next/dynamic", () => ({
  default: () => () => null,
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

vi.mock("next/image", () => ({
  default: () => null,
}));

vi.mock("@/components/ThemeToggle", () => ({
  ThemeToggle: ({ compact = false }: { compact?: boolean }) => (
    <button type="button" data-testid="theme-toggle" data-compact={compact}>
      Tema
    </button>
  ),
}));

vi.mock("@/components/notificaciones/NotificacionBell", () => ({
  NotificacionBell: () => <button type="button">Notificaciones</button>,
}));

vi.mock("@/components/ui/Avatar", () => ({
  Avatar: () => <span>Avatar</span>,
}));

vi.mock("@/components/LogoutButton", () => ({
  LogoutButton: () => <button type="button">Cerrar sesión</button>,
}));

describe("Navbar surface", () => {
  beforeEach(() => {
    mockState.session = null;
    mockState.homeSession = null;
    mockState.pathname = "/";
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });

  it("renders a theme toggle in desktop actions and outside the mobile drawer", () => {
    const { getByTestId, getAllByTestId } = render(<Navbar />);

    expect(getAllByTestId("theme-toggle")).toHaveLength(2);
    expect(getByTestId("navbar-desktop-actions")).toContainElement(
      getAllByTestId("theme-toggle")[0]
    );
    expect(getByTestId("navbar-mobile-actions")).toContainElement(
      getAllByTestId("theme-toggle")[1]
    );
    expect(getAllByTestId("theme-toggle")[1]).toHaveAttribute("data-compact", "true");
  });

  it("keeps the global navbar on authentication routes", () => {
    const { getByRole } = render(<AuthAwareNavbar />);

    expect(getByRole("banner")).toBeInTheDocument();
  });

  it("uses a frosted-glass background with backdrop blur", () => {
    const { container } = render(<Navbar />);
    const header = container.querySelector("header");

    expect(header?.className).toMatch(/bg-navbar\/40/);
    expect(header?.className).toContain("backdrop-blur-lg");
    expect(header?.className).toContain(
      "dark:bg-[var(--color-background)]/60"
    );

    Object.defineProperty(window, "scrollY", { configurable: true, value: 16 });
    fireEvent.scroll(window);

    expect(header?.className).toContain("bg-navbar/75");
    expect(header?.className).toContain(
      "dark:bg-[var(--color-background)]/80"
    );
  });

  it("only exposes administrator settings to ADMIN users", () => {
    mockState.session = {
      user: { name: "Cliente", email: "cliente@example.com", rol: Rol.CLIENTE },
    };
    const clientView = render(
      <Navbar userRol={Rol.CLIENTE} />
    );

    fireEvent.click(
      clientView.getAllByRole("button", { name: "Menú de usuario" })[0]
    );
    expect(
      clientView.queryByRole("menuitem", { name: "Configuración" })
    ).not.toBeInTheDocument();
    clientView.unmount();

    mockState.session = {
      user: { name: "Admin", email: "admin@example.com", rol: Rol.ADMIN },
    };
    const adminView = render(<Navbar userRol={Rol.ADMIN} />);
    fireEvent.click(
      adminView.getAllByRole("button", { name: "Menú de usuario" })[0]
    );
    expect(
      adminView.getByRole("menuitem", { name: "Configuración" })
    ).toHaveAttribute("href", "/admin");
  });

  it("keeps logout out of the navbar on dashboard and sidebar views", () => {
    mockState.session = {
      user: { name: "Cliente", email: "cliente@example.com", rol: Rol.CLIENTE },
    };
    mockState.pathname = "/catalogo";

    const { queryByRole, rerender } = render(<Navbar userRol={Rol.CLIENTE} />);
    expect(queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();

    mockState.pathname = "/cliente";
    rerender(<Navbar userRol={Rol.CLIENTE} />);
    expect(queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();
  });

  it("does not show session-only links in the anonymous mobile menu", () => {
    const { getByRole, queryByRole } = render(<Navbar />);

    fireEvent.click(getByRole("button", { name: "Abrir menú" }));

    expect(queryByRole("link", { name: "Mi perfil" })).not.toBeInTheDocument();
    expect(queryByRole("button", { name: "Notificaciones" })).not.toBeInTheDocument();
  });

  it.each([
    [Rol.CLIENTE, "/cliente"],
    [Rol.NEGOCIO, "/negocio"],
    [Rol.LOGISTICA, "/logistica"],
    [Rol.ADMIN, "/admin"],
  ])("sends a signed-in %s user from both home CTAs to %s", async (role, dashboard) => {
    mockState.homeSession = { user: { rol: role } };
    const homePage = await HomePage({ searchParams: Promise.resolve({}) });
    const { getAllByRole, queryByRole } = render(homePage);

    const dashboardLinks = getAllByRole("link", { name: "Ir a mi dashboard" });
    expect(dashboardLinks).toHaveLength(2);
    expect(dashboardLinks.map((link) => link.getAttribute("href"))).toEqual([
      dashboard,
      dashboard,
    ]);
    expect(
      queryByRole("link", { name: "Crear cuenta gratis" })
    ).not.toBeInTheDocument();
  });

  it("does not duplicate the root navbar in the public home page", async () => {
    const homePage = await HomePage({ searchParams: Promise.resolve({}) });
    const { container } = render(homePage);
    const navbar = container.querySelector("main.app-background > nav");

    expect(navbar).not.toBeInTheDocument();
  });
});
