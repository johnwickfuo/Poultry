import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: { findMany: vi.fn(), findFirst: vi.fn() },
  sellerDeliveryRate: { upsert: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
  settings: { getSetting: vi.fn() },
}));

vi.mock("@/server/database/prisma", () => ({ prisma: mocks }));
vi.mock("@/server/settings", () => ({ getSetting: mocks.settings.getSetting }));

import { canRevealPickupDetails, DeliveryError, saveSellerDeliveryRate, setSellerDeliveryRateActive, validateDeliverySelections } from "@/server/delivery";

const seller = (rates: Array<{ state: string; feeKobo: bigint }> = [], pickup = false) => ({
  id: "seller_1", username: "farm-one", status: "ACTIVE", deletedAt: null,
  sellerProfile: { businessName: "Farm One", verificationStatus: "APPROVED", buyerPickupEnabled: pickup, pickupState: pickup ? "Ogun" : null, pickupLga: pickup ? "Abeokuta South" : null, pickupAddress: pickup ? "17 Hatchery Road" : null, pickupInstructions: pickup ? "Ask for the storekeeper" : null },
  sellerDeliveryRates: rates,
});

beforeEach(() => { vi.clearAllMocks(); mocks.settings.getSetting.mockResolvedValue(false); });

describe("seller delivery rates", () => {
  it("stores state rates as integer kobo scoped to the seller", async () => {
    await saveSellerDeliveryRate("seller_1", "Ogun", 12_500n);
    expect(mocks.sellerDeliveryRate.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { sellerId_state: { sellerId: "seller_1", state: "Ogun" } }, create: expect.objectContaining({ feeKobo: 12_500n }) }));
  });

  it("does not allow a seller to edit another seller's rate", async () => {
    mocks.sellerDeliveryRate.updateMany.mockResolvedValue({ count: 0 });
    await expect(setSellerDeliveryRateActive("seller_1", "another-seller-rate", false)).rejects.toBeInstanceOf(DeliveryError);
  });
});

describe("checkout delivery validation", () => {
  it("uses an active seller state rate and creates a separate delivery resolution", async () => {
    mocks.user.findMany.mockResolvedValue([seller([{ state: "Ogun", feeKobo: 25_000n }])]);
    const result = await validateDeliverySelections(["seller_1"], { buyerState: "Ogun", selections: { seller_1: "SELLER_ARRANGED" } });
    expect(result.get("seller_1")).toMatchObject({ method: "SELLER_ARRANGED", feeKobo: 25_000n, deliveryState: "Ogun" });
  });

  it("blocks checkout when seller-arranged delivery has no rate for the buyer state", async () => {
    mocks.user.findMany.mockResolvedValue([seller([{ state: "Lagos", feeKobo: 25_000n }])]);
    await expect(validateDeliverySelections(["seller_1"], { buyerState: "Ogun", selections: { seller_1: "SELLER_ARRANGED" } })).rejects.toMatchObject({ code: "MISSING_RATE" });
  });

  it("does not permit quote-required delivery while the feature is disabled", async () => {
    mocks.user.findMany.mockResolvedValue([seller()]);
    await expect(validateDeliverySelections(["seller_1"], { buyerState: "Ogun", selections: { seller_1: "QUOTE_REQUIRED" } })).rejects.toMatchObject({ code: "QUOTE_DISABLED" });
  });
});

describe("pickup privacy", () => {
  it("reveals pickup details only after verified payment", () => {
    expect(canRevealPickupDetails({ paidAt: null, status: "PENDING_PAYMENT" })).toBe(false);
    expect(canRevealPickupDetails({ paidAt: new Date(), status: "PAID" })).toBe(true);
  });
});
