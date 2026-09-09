import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("Home", () => {
  it("renders the internal project codename", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: /poultry platform/i }),
    ).toBeInTheDocument();
  });
});
