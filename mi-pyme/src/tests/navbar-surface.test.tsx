import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import { Navbar } from "@/components/Navbar";
import { AuthAwareNavbar } from "@/components/Navbar/AuthAwareNavbar";
import HomePage from "@/app/page";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
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
  useSession: () => ({ data: null }),
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

    expect(header?.className).toMatch(/bg-navbar\/(70|95)/);
    expect(header?.className).toMatch(/backdrop-blur-(md|xl)/);
  });

  it("does not duplicate the root navbar in the public home page", async () => {
    const homePage = await HomePage({ searchParams: Promise.resolve({}) });
    const { container } = render(homePage);
    const navbar = container.querySelector("main.app-background > nav");

    expect(navbar).not.toBeInTheDocument();
  });
});
