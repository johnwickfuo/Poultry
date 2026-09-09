import { describe, expect, it } from "vitest";

import { applyBrandPlaceholders } from "@/server/branding/placeholders";
import {
  serializeSetting,
  SETTING_SEED_VALUES,
  socialLinksSchema,
} from "@/server/settings/registry";

describe("platform settings", () => {
  it("provides the required operating defaults", () => {
    expect(SETTING_SEED_VALUES).toMatchObject({
      consultation_standard_response_hours: 48,
      consultation_urgent_response_hours: 6,
      buyer_request_expiry_days: 14,
      quote_validity_days: 30,
      settlement_driver: "escrow",
      active_payment_gateway: "paystack",
      payout_mode: "manual_request",
      dispute_window_days: 7,
      consultation_followup_days: 30,
    });
  });

  it("serializes typed values and rejects unsafe social protocols", () => {
    expect(serializeSetting("marketplace_commission_percent", 12.5)).toBe(
      "12.5",
    );
    expect(() =>
      socialLinksSchema.parse({ support: "javascript:alert(1)" }),
    ).toThrow();
  });
});

describe("brand placeholders", () => {
  it("replaces company and short-company placeholders everywhere", () => {
    expect(
      applyBrandPlaceholders(
        "Welcome to {company}. {company_short} supports {company}.",
        { companyName: "Example Farms", companyShortName: "EF" },
      ),
    ).toBe("Welcome to Example Farms. EF supports Example Farms.");
  });
});
