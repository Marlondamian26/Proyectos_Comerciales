import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificacionDropdown } from "@/components/notificaciones/NotificacionDropdown";

vi.mock("@/components/notificaciones/NotificacionItem", () => ({
  NotificacionItem: () => null,
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

const baseProps = {
  open: true,
  notificaciones: [],
  noLeidas: 0,
  onMarcarLeida: vi.fn(),
  onArchivar: vi.fn(),
  onEliminar: vi.fn(),
  onMarcarTodasLeidas: vi.fn(),
  onClose: vi.fn(),
};

describe("NotificacionDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("se cierra con Escape", () => {
    render(<NotificacionDropdown {...baseProps} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it("no se cierra al pulsar el trigger", () => {
    render(
      <>
        <button id="notification-bell-trigger" type="button">
          Trigger
        </button>
        <NotificacionDropdown {...baseProps} />
      </>
    );
    fireEvent.mouseDown(screen.getByRole("button", { name: "Trigger" }));
    expect(baseProps.onClose).not.toHaveBeenCalled();
  });

  it("se cierra al pulsar fuera", () => {
    render(<NotificacionDropdown {...baseProps} />);
    fireEvent.mouseDown(document.body);
    expect(baseProps.onClose).toHaveBeenCalled();
  });
});
