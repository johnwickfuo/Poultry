import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  category: { findUnique: vi.fn() }, product: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  productVariant: { create: vi.fn(), deleteMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() }, bulkPriceTier: { create: vi.fn(), deleteMany: vi.fn() },
}));
vi.mock("@/server/database/prisma", () => ({ prisma: { ...mocks, $transaction: vi.fn(async (value: unknown) => typeof value === "function" ? (value as (tx: unknown) => unknown)({ ...mocks }) : Promise.all(value as Promise<unknown>[])) } }));

import { addBulkTier, addVariant, moderateProduct, ProductAccessError, requireActivePoultryCategory, requireOwnedProduct, updateProduct, updateProductStock } from "@/server/services/product-catalogue";
import { nairaToKobo, productFormSchema, variantSchema } from "@/server/validation/product";

const category = { id: "cat_1", slug: "broiler-chickens", isActive: true, parent: { slug: "live-birds", isActive: true } };
const product = { id: "prod_1", sellerId: "seller_1", categoryId: "cat_1", status: "DRAFT", isPublished: false, basePriceKobo: 200000, stockQuantity: 10, images: [], variants: [], bulkPriceTiers: [], category };
const input = { categoryId: "cat_1", name: "Healthy broiler chickens", slug: "healthy-broiler-chickens", shortDescription: "", description: "Healthy market-ready broilers from our farm.", brand: "", species: "Chicken", condition: "Live", sku: "BR-1", basePriceKobo: 200000, stockQuantity: 10, minimumOrderQuantity: 2, unitLabel: "bird", manufacturer: "", activeIngredient: "", dosageForm: "", packSize: "", expiryDate: null };

beforeEach(() => { vi.clearAllMocks(); mocks.category.findUnique.mockResolvedValue(category); mocks.product.findUnique.mockResolvedValue(product); mocks.product.update.mockResolvedValue(product); });

describe("product ownership and categories", () => {
  it("rejects access to another seller's product", async () => { mocks.product.findUnique.mockResolvedValue({ ...product, sellerId: "other_seller" }); await expect(requireOwnedProduct("prod_1", "seller_1")).rejects.toMatchObject<ProductAccessError>({ code: "FORBIDDEN" } as ProductAccessError); });
  it("blocks editing when ownership does not match", async () => { mocks.product.findUnique.mockResolvedValue({ ...product, sellerId: "other_seller" }); await expect(updateProduct("prod_1", "seller_1", input)).rejects.toMatchObject({ code: "FORBIDDEN" }); expect(mocks.product.update).not.toHaveBeenCalled(); });
  it("rejects inactive categories and children of inactive parents", async () => { mocks.category.findUnique.mockResolvedValue({ ...category, parent: { ...category.parent, isActive: false } }); await expect(requireActivePoultryCategory("cat_1")).rejects.toMatchObject({ code: "INVALID_CATEGORY" }); });
});

describe("integer-kobo pricing and stock", () => {
  it("converts naira decimals to exact integer kobo without floating point storage", () => { expect(nairaToKobo("1,250.50")).toBe(125050); expect(nairaToKobo("10.1")).toBe(1010); expect(nairaToKobo("10.999")).toBeUndefined(); expect(Number.isInteger(nairaToKobo("1250.50"))).toBe(true); });
  it("parses product form prices into integer kobo", () => { const parsed = productFormSchema.parse({ ...input, basePriceKobo: "2000.75", expiryDate: "" }); expect(parsed.basePriceKobo).toBe(200075); });
  it("stores variant pricing as integer kobo", async () => { const parsed = variantSchema.parse({ name: "2 kg bird", optionType: "weight", optionValue: "2 kg", sku: "V-2", priceKobo: "2500.50", stockQuantity: "4", isActive: "on" }); mocks.productVariant.create.mockResolvedValue({ id: "variant_1" }); await addVariant("prod_1", "seller_1", parsed); expect(mocks.productVariant.create).toHaveBeenCalledWith({ data: expect.objectContaining({ priceKobo: 250050, options: { weight: "2 kg" } }) }); });
  it("prevents negative stock", async () => { await expect(updateProductStock("prod_1", "seller_1", -1)).rejects.toMatchObject({ code: "INVALID_STATE" }); expect(mocks.product.update).not.toHaveBeenCalled(); });
});

describe("bulk pricing and moderation", () => {
  it("rejects overlapping bulk tiers", async () => { mocks.product.findUnique.mockResolvedValue({ ...product, bulkPriceTiers: [{ minimumQuantity: 10, maximumQuantity: 20 }] }); await expect(addBulkTier("prod_1", "seller_1", { minimumQuantity: 15, maximumQuantity: 30, unitPriceKobo: 180000 })).rejects.toMatchObject({ code: "INVALID_STATE" }); });
  it("rejects bulk pricing above the base price", async () => { await expect(addBulkTier("prod_1", "seller_1", { minimumQuantity: 10, maximumQuantity: null, unitPriceKobo: 210000 })).rejects.toMatchObject({ code: "INVALID_STATE" }); });
  it("sends material edits on approved products back to review", async () => { mocks.product.findUnique.mockResolvedValue({ ...product, status: "APPROVED", isPublished: true }); await updateProduct("prod_1", "seller_1", input); expect(mocks.product.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "PENDING_REVIEW", isPublished: false }) })); });
  it("enforces and records moderation state changes", async () => { mocks.product.findUnique.mockResolvedValue({ ...product, status: "PENDING_REVIEW" }); mocks.product.update.mockResolvedValue({ ...product, status: "APPROVED" }); await moderateProduct("prod_1", "admin_1", "approve"); expect(mocks.product.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "APPROVED", moderatedByUserId: "admin_1" }) })); mocks.product.findUnique.mockResolvedValue({ ...product, status: "DRAFT" }); await expect(moderateProduct("prod_1", "admin_1", "suspend")).rejects.toMatchObject({ code: "INVALID_STATE" }); });
  it("requires a meaningful reason when rejecting a product", async () => { await expect(moderateProduct("prod_1", "admin_1", "reject", "too short")).rejects.toMatchObject({ code: "INVALID_STATE" }); expect(mocks.product.findUnique).not.toHaveBeenCalled(); });
});
