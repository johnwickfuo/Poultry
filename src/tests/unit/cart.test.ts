import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cart: { findUnique: vi.fn(), upsert: vi.fn(), delete: vi.fn() },
  cartItem: { findUnique: vi.fn(), findFirst: vi.fn(), upsert: vi.fn(), update: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
  product: { findUnique: vi.fn() }, productVariant: { findFirst: vi.fn() },
}));
vi.mock("@/server/database/prisma", () => ({ prisma: { ...mocks, $transaction: vi.fn(async (value: unknown) => typeof value === "function" ? (value as (tx: typeof mocks) => unknown)(mocks) : Promise.all(value as Promise<unknown>[])) } }));

import { acceptCurrentCartPrices, addCartItem, CartError, mergeGuestCartIntoUser, reviewCartLine } from "@/server/cart/cart-service";
import { hashGuestCartToken, signGuestCartToken, verifyGuestCartCookie } from "@/server/cart/guest-token";

const product = {
  id: "product_1", slug: "broiler-feed", name: "Broiler feed", status: "APPROVED", isPublished: true,
  basePriceKobo: 100000, stockQuantity: 20, minimumOrderQuantity: 2, unitLabel: "bag",
  category: { isActive: true, imagePath: null, parent: { isActive: true } },
  seller: { status: "ACTIVE", deletedAt: null, sellerProfile: { verificationStatus: "APPROVED", businessName: "Farm" } },
  images: [], bulkPriceTiers: [{ minimumQuantity: 10, maximumQuantity: null, unitPriceKobo: 90000 }],
};

function line(overrides: Record<string, unknown> = {}) {
  return { id: "item_1", cartId: "cart_1", productId: product.id, variantId: null, variantKey: "", quantity: 2, unitPriceSnapshotKobo: 100000, createdAt: new Date(), updatedAt: new Date(), product, variant: null, ...overrides } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.product.findUnique.mockResolvedValue(product);
  mocks.productVariant.findFirst.mockResolvedValue(null);
  mocks.cartItem.findUnique.mockResolvedValue(null);
  mocks.cartItem.upsert.mockResolvedValue({ id: "item_1" });
  mocks.cartItem.update.mockResolvedValue({ id: "item_1" });
});

describe("signed guest-cart tokens", () => {
  it("verifies an authentic token and rejects tampering", () => {
    process.env.AUTH_SECRET = "a-secure-test-secret-that-is-longer-than-thirty-two-characters";
    const token = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ";
    const signed = signGuestCartToken(token);
    expect(verifyGuestCartCookie(signed)).toBe(token);
    expect(verifyGuestCartCookie(`${signed}tampered`)).toBeNull();
    expect(hashGuestCartToken(token)).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("cart line validation and pricing", () => {
  it("uses current quantity-based bulk pricing and flags a changed snapshot", () => {
    const review = reviewCartLine(line({ quantity: 12 }));
    expect(review.currentUnitPriceKobo).toBe(90000);
    expect(review.priceChanged).toBe(true);
    expect(review.issue).toBeNull();
  });

  it("blocks inactive sellers, unavailable variants, minimum orders and insufficient stock", () => {
    expect(reviewCartLine(line({ product: { ...product, seller: { ...product.seller, status: "SUSPENDED" } } })).issue).toContain("no longer available");
    expect(reviewCartLine(line({ variantId: "variant_1", variant: { id: "variant_1", productId: product.id, isActive: false, stockQuantity: 10, priceKobo: 120000 } })).issue).toContain("variant");
    expect(reviewCartLine(line({ quantity: 1 })).issue).toContain("Minimum order");
    expect(reviewCartLine(line({ quantity: 21 })).issue).toContain("remain in stock");
  });

  it("takes price from the server catalogue when adding an item", async () => {
    await addCartItem("cart_1", product.id, null, 2);
    expect(mocks.cartItem.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ unitPriceSnapshotKobo: 100000, quantity: 2 }) }));
  });

  it("rejects quantities below the product minimum", async () => {
    await expect(addCartItem("cart_1", product.id, null, 1)).rejects.toMatchObject<CartError>({ code: "INVALID_QUANTITY" } as CartError);
    expect(mocks.cartItem.upsert).not.toHaveBeenCalled();
  });

  it("requires price acknowledgement before replacing snapshots", async () => {
    mocks.cart.findUnique.mockResolvedValue({ id: "cart_1", items: [line({ quantity: 12 })] });
    await expect(acceptCurrentCartPrices("cart_1")).resolves.toBe(1);
    expect(mocks.cartItem.update).toHaveBeenCalledWith({ where: { id: "item_1" }, data: { unitPriceSnapshotKobo: 90000 } });
  });
});

describe("guest merge", () => {
  it("moves guest lines into the authenticated user's cart and deletes the guest cart", async () => {
    mocks.cart.findUnique.mockResolvedValue({ id: "guest_cart", items: [line()] });
    mocks.cart.upsert.mockResolvedValue({ id: "user_cart" });
    await mergeGuestCartIntoUser("user_1", "guest_hash");
    expect(mocks.cartItem.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ cartId: "user_cart", productId: product.id }) }));
    expect(mocks.cart.delete).toHaveBeenCalledWith({ where: { id: "guest_cart" } });
  });
});
