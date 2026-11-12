import { fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "@/components/Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
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

describe("Sidebar", () => {
  it("keeps the desktop collapse control outside and aligned to the sidebar edge", () => {
    const { getByRole } = render(<Sidebar />);
    const toggle = getByRole("button", { name: "Colapsar menú" });
    const sidebar = document.querySelector("aside[aria-label='Navegación principal']");

    expect(sidebar).toBeInTheDocument();
    expect(sidebar).not.toContainElement(toggle);
    expect(toggle.parentElement).toContainElement(sidebar);
    expect(toggle.className).toContain("left-full");
    expect(toggle.className).toContain("-translate-x-1/2");

    fireEvent.click(toggle);
    expect(getByRole("button", { name: "Expandir menú" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("opens the mobile drawer from its dedicated navigation control", () => {
    const { getByRole } = render(<Sidebar userRol="ADMIN" />);
    const openButton = getByRole("button", { name: "Abrir menú del panel" });

    fireEvent.click(openButton);

    expect(getByRole("complementary", { name: "Menú móvil del panel" })).toBeVisible();
    expect(getByRole("button", { name: "Cerrar menú del panel" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });
});
