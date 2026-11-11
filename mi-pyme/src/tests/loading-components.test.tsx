import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/Button";
import { BrandLoader } from "@/components/ui/BrandLoader";
import { Loading } from "@/components/ui/Loading";
import { Skeleton } from "@/components/ui/Skeleton";
import { LoadingRegion, ServiceGridSkeleton } from "@/components/skeletons/LoadingSkeletons";

vi.mock("next/image", () => ({
  default: () => null,
}));

describe("loading components", () => {
  it("renders skeleton lines as decorative placeholders with dimensions", () => {
    const { container } = render(
      <Skeleton variant="text" lines={3} width="80%" height={12} />
    );

    const lines = container.querySelectorAll(".skeleton-shimmer");
    expect(lines).toHaveLength(3);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    expect(lines[0]).toHaveStyle({ width: "80%", height: "12px" });
    expect(lines[2]).toHaveClass("w-3/4");
  });

  it("exposes an accessible loading status", () => {
    render(<Loading label="Cargando resultados" />);

    expect(screen.getByRole("status", { name: "Cargando resultados" })).toHaveAttribute(
      "aria-busy",
      "true"
    );
  });

  it("exposes button loading and preserves the default label when no loading text is given", () => {
    const { rerender } = render(
      <Button loading loadingText="Guardando cambios">
        Guardar
      </Button>
    );

    expect(screen.getByRole("button", { name: "Guardando cambios" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Guardando cambios" })).toHaveAttribute(
      "aria-busy",
      "true"
    );

    rerender(
      <Button loading>
        Guardar
      </Button>
    );
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Guardar" })).toHaveAttribute(
      "aria-busy",
      "true"
    );
  });

  it("provides labeled branded and route-level loading states", () => {
    const { rerender } = render(<BrandLoader message="Preparando catálogo" />);
    expect(screen.getByRole("status", { name: "Preparando catálogo" })).toBeInTheDocument();

    rerender(
      <LoadingRegion label="Cargando servicios">
        <ServiceGridSkeleton count={2} />
      </LoadingRegion>
    );
    expect(screen.getByRole("status", { name: "Cargando servicios" })).toBeInTheDocument();
    expect(document.querySelectorAll(".skeleton-shimmer").length).toBeGreaterThan(2);
  });

  it("does not dispatch interactions while the loading button is disabled", () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Guardar
      </Button>
    );

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
