import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cart: { findUnique: vi.fn() },
  cartItem: { deleteMany: vi.fn() },
  order: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
  product: { update: vi.fn(), updateMany: vi.fn() },
  productVariant: { update: vi.fn(), updateMany: vi.fn() },
  settings: { getSettings: vi.fn() },
}));

vi.mock("@/server/database/prisma", () => ({
  prisma: {
    ...mocks,
    $transaction: vi.fn(
      async (callback: (transaction: typeof mocks) => unknown) => callback(mocks),
    ),
  },
}));
vi.mock("@/server/settings", () => ({ getSettings: mocks.settings.getSettings }));

import {
  buildOrderDraft,
  calculateCommissionKobo,
  createOrderFromCart,
  generateOrderReference,
  getOrderForBuyer,
} from "@/server/orders";

const lines = [
  {
    sellerId: "seller_a",
    productId: "product_a",
    variantId: "variant_a",
    productName: "Point-of-lay birds",
    variantLabel: "18 weeks",
    sku: "POL-18",
    quantity: 2,
    unitPriceKobo: 100_001,
    productImagePath: "/media/products/pol.webp",
  },
  {
    sellerId: "seller_a",
    productId: "product_b",
    variantId: null,
    productName: "Layer mash",
    variantLabel: null,
    sku: "LM-25",
    quantity: 1,
    unitPriceKobo: 50_000,
    productImagePath: null,
  },
  {
    sellerId: "seller_b",
    productId: "product_c",
    variantId: null,
    productName: "Egg trays",
    variantLabel: null,
    sku: null,
    quantity: 3,
    unitPriceKobo: 10_000,
    productImagePath: "/media/products/trays.webp",
  },
];

function cartItem(line: (typeof lines)[number], id: string) {
  return {
    id,
    cartId: "cart_1",
    productId: line.productId,
    variantId: line.variantId,
    variantKey: line.variantId || "",
    quantity: line.quantity,
    unitPriceSnapshotKobo: line.unitPriceKobo,
    createdAt: new Date(),
    updatedAt: new Date(),
    variant: line.variantId
      ? {
          id: line.variantId,
          productId: line.productId,
          name: line.variantLabel,
          sku: line.sku,
          priceKobo: line.unitPriceKobo,
          stockQuantity: 20,
          isActive: true,
          options: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      : null,
    product: {
      id: line.productId,
      sellerId: line.sellerId,
      categoryId: "category_1",
      name: line.productName,
      slug: `${line.productId}-slug`,
      shortDescription: null,
      description: "Snapshot test product",
      brand: null,
      species: null,
      condition: null,
      sku: line.sku,
      basePriceKobo: line.unitPriceKobo,
      stockQuantity: 20,
      minimumOrderQuantity: 1,
      unitLabel: "item",
      status: "APPROVED",
      isFeatured: false,
      isPublished: true,
      manufacturer: null,
      activeIngredient: null,
      dosageForm: null,
      packSize: null,
      expiryDate: null,
      rejectionReason: null,
      moderatedAt: null,
      moderatedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: { id: "category_1", isActive: true, parent: null },
      seller: {
        id: line.sellerId,
        status: "ACTIVE",
        deletedAt: null,
        sellerProfile: { verificationStatus: "APPROVED" },
      },
      images: line.productImagePath ? [{ path: line.productImagePath }] : [],
      bulkPriceTiers: [],
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.settings.getSettings.mockResolvedValue({
    marketplace_commission_percent: 7.5,
    active_payment_gateway: "paystack",
  });
  mocks.order.create.mockResolvedValue({ id: "order_1", reference: "POU-20260909-ABCDEF123456" });
  mocks.cartItem.deleteMany.mockResolvedValue({ count: 3 });
});

describe("order draft calculations", () => {
  it("splits a cart into one seller sub-order and commission snapshot per seller", () => {
    const draft = buildOrderDraft(lines, 7.5, "paystack");
    expect(draft.subOrders).toHaveLength(2);
    expect(draft.subOrders[0]).toMatchObject({
      sellerId: "seller_a",
      subtotalKobo: 250_002n,
      commissionPercentSnapshot: "7.50",
      commissionAmountKobo: 18_750n,
      sellerPayoutAmountKobo: 231_252n,
    });
    expect(draft.subOrders[1]).toMatchObject({
      sellerId: "seller_b",
      subtotalKobo: 30_000n,
      commissionAmountKobo: 2_250n,
      sellerPayoutAmountKobo: 27_750n,
    });
  });

  it("reconciles item, sub-order, delivery and parent totals exactly", () => {
    const delivery = new Map([
      ["seller_a", { method: "COURIER", feeKobo: 1_500n }],
      ["seller_b", { method: "PICKUP", feeKobo: 2_500n }],
    ]);
    const draft = buildOrderDraft(lines, 7.5, "paystack", delivery);
    expect(draft.subtotalKobo).toBe(280_002n);
    expect(draft.deliveryTotalKobo).toBe(4_000n);
    expect(draft.grandTotalKobo).toBe(284_002n);
    expect(draft.subOrders.flatMap(({ items }) => items).reduce((sum, item) => sum + item.lineTotalKobo, 0n)).toBe(draft.subtotalKobo);
  });

  it("uses immutable historical product snapshots", () => {
    const source = lines.map((line) => ({ ...line }));
    const draft = buildOrderDraft(source, 5, "paystack");
    source[0].productName = "Renamed live product";
    source[0].unitPriceKobo = 999_999;
    expect(draft.subOrders[0].items[0]).toMatchObject({
      productName: "Point-of-lay birds",
      variantLabel: "18 weeks",
      sku: "POL-18",
      unitPriceKobo: 100_001n,
      lineTotalKobo: 200_002n,
      productImagePath: "/media/products/pol.webp",
    });
  });

  it("performs commission and line calculations in integer kobo", () => {
    expect(calculateCommissionKobo(100_001n, 750)).toBe(7_500n);
    const item = buildOrderDraft(lines.slice(0, 1), 7.5, "paystack").subOrders[0].items[0];
    expect(typeof item.unitPriceKobo).toBe("bigint");
    expect(typeof item.lineTotalKobo).toBe("bigint");
  });

  it("generates support-friendly collision-resistant references", () => {
    expect(generateOrderReference(new Date("2026-09-09T12:00:00Z"))).toMatch(/^POU-20260909-[A-F0-9]{12}$/);
  });
});

describe("transactional order creation", () => {
  it("revalidates acknowledged lines, creates snapshots, clears the cart and never changes stock", async () => {
    mocks.cart.findUnique.mockResolvedValue({
      id: "cart_1",
      userId: "buyer_1",
      items: lines.map((line, index) => cartItem(line, `item_${index}`)),
    });
    await expect(createOrderFromCart("buyer_1")).resolves.toMatchObject({ id: "order_1" });
    expect(mocks.order.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: "buyer_1",
        subtotalKobo: 280_002n,
        subOrders: { create: expect.arrayContaining([expect.objectContaining({ sellerId: "seller_a" }), expect.objectContaining({ sellerId: "seller_b" })]) },
      }),
    }));
    expect(mocks.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: "cart_1" } });
    expect(mocks.product.update).not.toHaveBeenCalled();
    expect(mocks.product.updateMany).not.toHaveBeenCalled();
    expect(mocks.productVariant.update).not.toHaveBeenCalled();
  });

  it("blocks creation when a live price differs from the acknowledged snapshot", async () => {
    const changed = cartItem(lines[0], "item_1");
    changed.product.basePriceKobo += 1;
    changed.variant!.priceKobo += 1;
    mocks.cart.findUnique.mockResolvedValue({ id: "cart_1", userId: "buyer_1", items: [changed] });
    await expect(createOrderFromCart("buyer_1")).rejects.toMatchObject({ code: "PRICE_CHANGED" });
    expect(mocks.order.create).not.toHaveBeenCalled();
  });

  it("revalidates seller, variant, stock and minimum-order availability", async () => {
    const invalidCases = [
      (item: ReturnType<typeof cartItem>) => { item.product.seller.status = "SUSPENDED"; },
      (item: ReturnType<typeof cartItem>) => { item.variant!.isActive = false; },
      (item: ReturnType<typeof cartItem>) => { item.variant!.stockQuantity = 1; },
      (item: ReturnType<typeof cartItem>) => { item.product.minimumOrderQuantity = 3; },
    ];

    for (const invalidate of invalidCases) {
      const item = cartItem(lines[0], "item_1");
      invalidate(item);
      mocks.cart.findUnique.mockResolvedValue({ id: "cart_1", userId: "buyer_1", items: [item] });
      await expect(createOrderFromCart("buyer_1")).rejects.toMatchObject({ code: "INVALID_CART" });
    }
    expect(mocks.order.create).not.toHaveBeenCalled();
  });

  it("scopes order lookup to the authenticated buyer to prevent unauthorized access", async () => {
    mocks.order.findFirst.mockResolvedValue(null);
    await expect(getOrderForBuyer("buyer_1", "POU-PRIVATE")).resolves.toBeNull();
    expect(mocks.order.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "buyer_1", reference: "POU-PRIVATE" },
    }));
  });
});
