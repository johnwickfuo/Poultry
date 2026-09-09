import { expect, test } from "@playwright/test";

test("shows the platform foundation", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Poultry platform" }),
  ).toBeVisible();
});

test("shows the credentials authentication pages", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible();
});
