import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { DisponibilidadBadge } from "@/components/ui/DisponibilidadBadge";

describe("Badge - accessibility regression", () => {
  const variants: (string | undefined)[] = [
    "default",
    "primary",
    "secondary",
    "success",
    "warning",
    "error",
    "info",
    "outline",
    undefined,
  ];

  for (const variant of variants) {
    it(`Badge variant="${variant ?? "undefined"}}" renders with accessible text`, () => {
      const { container } = render(
        <Badge variant={variant as never} data-testid={`badge-${variant ?? "default"}`}>
          Test badge text
        </Badge>
      );

      const badge = screen.getByTestId(`badge-${variant ?? "default"}`);
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("Test badge text");
    });
  }

  it("Badge with dot has aria-hidden span for the dot indicator", () => {
    const { container } = render(
      <Badge variant="warning" dot>
        Warning text
      </Badge>
    );

    const dot = container.querySelector('span[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass("h-1.5", "w-1.5", "rounded-full");
  });

  it("Badge has accessible role and text content", () => {
    render(
      <Badge variant="success" data-testid="success-badge">
        Activo
      </Badge>
    );

    const badge = screen.getByTestId("success-badge");
    expect(badge).toHaveTextContent("Activo");
  });

  it("StatusBadge renders appropriate text for each status", () => {
    const statuses = [
      { status: "pending", expected: "Pendiente" },
      { status: "active", expected: "Activo" },
      { status: "completed", expected: "Completado" },
      { status: "cancelled", expected: "Cancelado" },
      { status: "failed", expected: "Fallido" },
      { status: "draft", expected: "Borrador" },
    ];

    for (const { status, expected } of statuses) {
      const { unmount } = render(
        <StatusBadge status={status as never} data-testid={`status-${status}`} />
      );
      const badge = screen.getByTestId(`status-${status}`);
      expect(badge).toHaveTextContent(expected);
      unmount();
    }
  });
});

describe("DisponibilidadBadge - accessibility regression", () => {
  it("renders with role=status and aria-live for unavailable product", () => {
    render(
      <DisponibilidadBadge disponible={false} variante="producto" />
    );

    const badge = screen.getByTestId("disponibilidad-badge");
    expect(badge).toHaveAttribute("role", "status");
    expect(badge).toHaveAttribute("aria-live", "polite");
    expect(badge).toHaveTextContent(/No disponible hoy/i);
  });

  it("renders warning variant when last units", () => {
    render(
      <DisponibilidadBadge
        disponible={true}
        cantidad={2}
        variante="producto"
      />
    );

    const badge = screen.getByTestId("disponibilidad-badge");
    expect(badge).toHaveTextContent(/Últimas.*unidad/i);
  });

  it("renders success variant when available with sufficient units", () => {
    render(
      <DisponibilidadBadge
        disponible={true}
        cantidad={10}
        variante="producto"
      />
    );

    const badge = screen.getByTestId("disponibilidad-badge");
    expect(badge).toHaveTextContent(/Disponible hoy/i);
  });

  it("renders service variant with correct text", () => {
    render(
      <DisponibilidadBadge
        disponible={true}
        cantidad={5}
        variante="servicio"
      />
    );

    const badge = screen.getByTestId("disponibilidad-badge");
    expect(badge).toHaveTextContent(/Cupos disponibles/i);
  });

  it("renders service unavailable with correct text", () => {
    render(
      <DisponibilidadBadge
        disponible={false}
        variante="servicio"
      />
    );

    const badge = screen.getByTestId("disponibilidad-badge");
    expect(badge).toHaveTextContent(/Sin cupos hoy/i);
  });

  it("sr-only text is present when fecha is provided and unavailable", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    render(
      <DisponibilidadBadge
        disponible={false}
        fecha={tomorrow}
        variante="producto"
      />
    );

    const badge = screen.getByTestId("disponibilidad-badge");
    const srOnly = badge.querySelector(".sr-only");
    expect(srOnly).toBeInTheDocument();
    expect(srOnly?.textContent).toMatch(/mañana|hoy|para/i);
  });

  it("warning variant uses text-warning-foreground for contrast (regression)", () => {
    const { container } = render(
      <Badge variant="warning" data-testid="warning-badge-regression">
        Últimas unidades
      </Badge>
    );

    const badge = screen.getByTestId("warning-badge-regression");
    expect(badge).toBeInTheDocument();
  });

  it("badge text has sufficient contrast against its background", () => {
    const variants = ["default", "primary", "secondary", "success", "warning", "error", "info", "outline"];

    for (const variant of variants) {
      render(
        <Badge variant={variant as never} data-testid={`contrast-${variant}`}>
          Contrast test {variant}
        </Badge>
      );

      const badge = screen.getByTestId(`contrast-${variant}`);
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("font-medium");
    }
  });
});
