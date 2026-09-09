import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccountNavigation } from "@/components/account-navigation";

describe("AccountNavigation", () => {
  it("only displays destinations backed by assigned roles", () => {
    render(<AccountNavigation roles={["seller", "mentor"]} />);

    expect(screen.getByRole("link", { name: "Seller workspace" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Mentor workspace" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Administration" })).toBeNull();
  });
});
