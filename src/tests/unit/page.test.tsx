import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeContent } from "@/components/home-content";

describe("Home", () => {
  it("renders the internal project codename", () => {
    render(<HomeContent companyName="Poultry Platform" tagline="" />);
    expect(
      screen.getByRole("heading", { level: 1, name: /poultry platform/i }),
    ).toBeInTheDocument();
  });
});
