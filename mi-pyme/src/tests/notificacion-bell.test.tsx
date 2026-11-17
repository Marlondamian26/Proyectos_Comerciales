import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificacionBell } from "@/components/notificaciones/NotificacionBell";

vi.mock("@/hooks/useCloseOnRouteChange", () => ({
  useCloseOnRouteChange: () => undefined,
}));

vi.mock("@/components/ui/Toast", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock("@/components/notificaciones/NotificacionDropdown", () => ({
  NotificacionDropdown: ({
    open,
    onClose,
  }: {
    open: boolean;
    onClose: () => void;
  }) =>
    open ? (
      <div data-testid="notification-panel">
        <button type="button" onClick={onClose}>
          Cerrar
        </button>
      </div>
    ) : null,
}));

describe("NotificacionBell", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ count: 1, data: [], total: 0, page: 1, limit: 5, hasNext: false, hasPrev: false }),
      }))
    );
  });

  it("abre y cierra el panel con el mismo trigger", async () => {
    render(<NotificacionBell />);

    const trigger = await screen.findByRole("button", {
      name: /Notificaciones/,
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("notification-panel")).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("notification-panel")).not.toBeInTheDocument();
  });
});
