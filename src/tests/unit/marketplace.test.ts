import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  product: { count: vi.fn(), findMany: vi.fn() },
  productVariant: { findMany: vi.fn() },
  user: { findMany: vi.fn(), findFirst: vi.fn() },
  queryRaw: vi.fn(),
}));

vi.mock("@/server/database/prisma", () => ({ prisma: { product: mocks.product, productVariant: mocks.productVariant, user: mocks.user, $queryRaw: mocks.queryRaw, $transaction: vi.fn(async (queries: Array<Promise<unknown>>) => Promise.all(queries)) } }));

import { marketplaceOrderBy, publicProductWhere, searchMarketplace } from "@/server/services/marketplace-search";
import { marketplacePageHref, parseMarketplaceParams } from "@/server/validation/marketplace";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.product.count.mockResolvedValue(0);
  mocks.product.findMany.mockResolvedValue([]);
  mocks.queryRaw.mockResolvedValue([]);
});

describe("marketplace parameter validation", () => {
  it("parses prices as exact integer kobo and rejects unsupported sorting", () => {
    expect(parseMarketplaceParams({ minPrice: "1,250.50", maxPrice: "3000", sort: "rating" })).toMatchObject({ minPriceKobo: 125050, maxPriceKobo: 300000, sort: "newest" });
  });

  it("accepts known variant attributes and ignores unknown keys", () => {
    expect(parseMarketplaceParams({ attribute: "breed:Cobb 500" })).toMatchObject({ attributeKey: "breed", attributeValue: "Cobb 500" });
    expect(parseMarketplaceParams({ attribute: "colour:red" }).attributeKey).toBeUndefined();
  });

  it("preserves filters in pagination URLs", () => {
    expect(marketplacePageHref("/marketplace", { q: "layers", species: "Chicken", page: "1" }, 3)).toBe("/marketplace?q=layers&species=Chicken&page=3");
  });
});

describe("public catalogue safeguards", () => {
  it("defines approved, published, active-seller visibility as the shared baseline", () => {
    expect(publicProductWhere).toMatchObject({ status: "APPROVED", isPublished: true, seller: { status: "ACTIVE", deletedAt: null, sellerProfile: { verificationStatus: "APPROVED" } } });
  });

  it("applies the shared visibility filter to marketplace searches", async () => {
    await searchMarketplace({ category: "eggs", inStock: true });
    expect(mocks.product.count).toHaveBeenCalledWith({ where: expect.objectContaining({ AND: expect.arrayContaining([publicProductWhere, expect.objectContaining({ OR: expect.any(Array) })]) }) });
  });

  it("supports all currently available sort orders", () => {
    expect(marketplaceOrderBy("newest")).toEqual([{ createdAt: "desc" }]);
    expect(marketplaceOrderBy("price-asc")[0]).toEqual({ basePriceKobo: "asc" });
    expect(marketplaceOrderBy("price-desc")[0]).toEqual({ basePriceKobo: "desc" });
    expect(marketplaceOrderBy("popularity")[0]).toEqual({ isFeatured: "desc" });
  });
});
