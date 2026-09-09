import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";
import { Money, Rating } from "@/components/ui/commerce";
import { Badge, StatusBadge } from "@/components/ui/feedback";

describe("design-system primitives", () => {
  it("renders accessible actions and state labels", () => {
    render(
      <>
        <Button>Buy now</Button>
        <Badge tone="yolk">Bulk</Badge>
        <StatusBadge status="active" />
      </>,
    );

    expect(screen.getByRole("button", { name: "Buy now" })).toBeEnabled();
    expect(screen.getByText("Bulk")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("formats Nigerian prices and exposes rating context", () => {
    render(
      <>
        <Money amount={12500} />
        <Rating count={18} value={4.5} />
      </>,
    );

    expect(screen.getByText(/12,500/)).toBeInTheDocument();
    expect(screen.getByLabelText(/4.5 out of 5 stars from 18 reviews/i)).toBeInTheDocument();
  });
});
