import { expect, test } from "@playwright/test";

test("shows the platform foundation", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Poultry platform" }),
  ).toBeVisible();
});
