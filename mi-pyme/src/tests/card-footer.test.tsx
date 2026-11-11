import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it } from "vitest";
import { Card } from "@/components/ui/Card";

describe("Card footer", () => {
  it("uses the card surface with a subtle top border and readable content", () => {
    render(
      <Card
        footer={
          <div>
            <span className="text-sm font-medium text-foreground">30 min</span>
            <span className="text-sm font-medium text-foreground">2</span>
          </div>
        }
      >
        Servicio
      </Card>
    );

    const footerContent = screen.getByText("30 min").parentElement;
    const footer = footerContent?.parentElement;

    expect(footer).toHaveClass("border-t", "border-border");
    expect(footer?.className).not.toMatch(/\bbg-/);
    expect(screen.getByText("30 min")).toHaveClass("text-foreground");
    expect(screen.getByText("2")).toHaveClass("text-foreground");
  });
});
