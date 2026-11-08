import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import { Navbar } from "@/components/Navbar";
import HomePage from "@/app/page";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/actions", () => ({
  listarAreas: vi.fn().mockResolvedValue([]),
  listarNegocios: vi.fn().mockResolvedValue([]),
  listarServicios: vi.fn().mockResolvedValue([]),
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
  ThemeToggle: () => <button type="button">Tema</button>,
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
  it("uses a frosted-glass background with backdrop blur", () => {
    const { container } = render(<Navbar />);
    const header = container.querySelector("header");

    expect(header?.className).toMatch(/bg-background\/(60|80|95)/);
    expect(header?.className).toMatch(/backdrop-blur-xl/);
  });

  it("keeps the public home navbar with frosted-glass styling", async () => {
    const homePage = await HomePage({ searchParams: Promise.resolve({}) });
    const { container } = render(homePage);
    const navbar = container.querySelector("main.app-background > nav");

    expect(navbar?.className).toMatch(/bg-background\/(60|80|95)/);
    expect(navbar?.className).toMatch(/backdrop-blur-xl/);
  });
});
