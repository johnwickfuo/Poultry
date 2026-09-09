import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeContent } from "@/components/home-content";

describe("Home", () => {
  it("renders the poultry marketplace proposition", () => {
    render(<HomeContent companyName="Poultry Platform" tagline="" />);
    expect(
      screen.getByRole("heading", { level: 1, name: /buy from farms/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Poultry Platform").length).toBeGreaterThan(0);
  });
});
