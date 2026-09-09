import { describe, expect, it } from "vitest";

import { hashToken } from "@/server/authentication/tokens";
import { registerSchema, resetPasswordSchema } from "@/server/validation/auth";

describe("authentication validation", () => {
  it("normalizes valid registration identifiers", () => {
    const result = registerSchema.parse({
      email: "  Person@Example.com ",
      username: "Seller_One",
      password: "SecurePass123",
      confirmPassword: "SecurePass123",
    });

    expect(result.email).toBe("person@example.com");
    expect(result.username).toBe("seller_one");
  });

  it("rejects mismatched reset passwords", () => {
    const result = resetPasswordSchema.safeParse({
      token: "a".repeat(64),
      password: "SecurePass123",
      confirmPassword: "DifferentPass123",
    });

    expect(result.success).toBe(false);
  });

  it("stores only a one-way token digest", () => {
    const token = "b".repeat(64);
    const digest = hashToken(token);

    expect(digest).toHaveLength(64);
    expect(digest).not.toBe(token);
  });
});
