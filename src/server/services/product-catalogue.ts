import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/database/prisma";

export class ProductAccessError extends Error {
  constructor(public code: "NOT_FOUND" | "FORBIDDEN" | "INVALID_CATEGORY" | "INVALID_STATE", message: string) { super(message); this.name = "ProductAccessError"; }
}

export type ProductInput = {
  categoryId: string; name: string; slug: string; shortDescription?: string; description: string; brand?: string; species?: string; condition?: string; sku?: string;
  basePriceKobo: number; stockQuantity: number; minimumOrderQuantity: number; unitLabel: string;
  manufacturer?: string; activeIngredient?: string; dosageForm?: string; packSize?: string; expiryDate?: Date | null;
};

const includeCatalogue = { category: { include: { parent: true } }, images: { orderBy: { sortOrder: "asc" as const } }, variants: { orderBy: { createdAt: "asc" as const } }, bulkPriceTiers: { orderBy: { minimumQuantity: "asc" as const } } } satisfies Prisma.ProductInclude;

export async function requireActivePoultryCategory(categoryId: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId }, include: { parent: true } });
  if (!category || !category.isActive || (category.parent && !category.parent.isActive)) throw new ProductAccessError("INVALID_CATEGORY", "Choose an active poultry category.");
  return category;
}

export async function requireOwnedProduct(productId: string, sellerId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId }, include: includeCatalogue });
  if (!product) throw new ProductAccessError("NOT_FOUND", "Product not found.");
  if (product.sellerId !== sellerId) throw new ProductAccessError("FORBIDDEN", "You cannot manage another seller's product.");
  return product;
}

export function listSellerProducts(sellerId: string) { return prisma.product.findMany({ where: { sellerId }, include: { category: true, images: { where: { isPrimary: true }, take: 1 } }, orderBy: { updatedAt: "desc" } }); }
export function getProductForSeller(productId: string, sellerId: string) { return requireOwnedProduct(productId, sellerId); }
export function getActiveProductCategories() { return prisma.category.findMany({ where: { isActive: true, OR: [{ parentId: null }, { parent: { isActive: true } }] }, include: { parent: { select: { name: true, slug: true } } }, orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }] }); }

export async function createProduct(sellerId: string, input: ProductInput) {
  await requireActivePoultryCategory(input.categoryId);
  return prisma.product.create({ data: { sellerId, ...input, shortDescription: input.shortDescription || null, brand: input.brand || null, species: input.species || null, condition: input.condition || null, sku: input.sku || null, manufacturer: input.manufacturer || null, activeIngredient: input.activeIngredient || null, dosageForm: input.dosageForm || null, packSize: input.packSize || null } });
}

export async function updateProduct(productId: string, sellerId: string, input: ProductInput) {
  const current = await requireOwnedProduct(productId, sellerId);
  await requireActivePoultryCategory(input.categoryId);
  const requiresReview = current.status === "APPROVED";
  return prisma.product.update({ where: { id: productId }, data: { ...input, shortDescription: input.shortDescription || null, brand: input.brand || null, species: input.species || null, condition: input.condition || null, sku: input.sku || null, manufacturer: input.manufacturer || null, activeIngredient: input.activeIngredient || null, dosageForm: input.dosageForm || null, packSize: input.packSize || null, status: requiresReview ? "PENDING_REVIEW" : current.status === "REJECTED" ? "DRAFT" : current.status, isPublished: requiresReview ? false : current.isPublished, rejectionReason: null } });
}

export async function markMaterialEdit(productId: string, sellerId: string) {
  const product = await requireOwnedProduct(productId, sellerId);
  if (product.status === "APPROVED") await prisma.product.update({ where: { id: productId }, data: { status: "PENDING_REVIEW", isPublished: false } });
}

export async function submitProduct(productId: string, sellerId: string) {
  const product = await requireOwnedProduct(productId, sellerId);
  if (!["DRAFT", "REJECTED"].includes(product.status)) throw new ProductAccessError("INVALID_STATE", "Only draft or rejected products can be submitted.");
  return prisma.product.update({ where: { id: productId }, data: { status: "PENDING_REVIEW", isPublished: false, rejectionReason: null } });
}

export async function setProductPublished(productId: string, sellerId: string, published: boolean) {
  const product = await requireOwnedProduct(productId, sellerId);
  if (published && product.status !== "APPROVED") throw new ProductAccessError("INVALID_STATE", "Only approved products can be published.");
  return prisma.product.update({ where: { id: productId }, data: { isPublished: published } });
}

export async function updateProductStock(productId: string, sellerId: string, stockQuantity: number) {
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) throw new ProductAccessError("INVALID_STATE", "Stock cannot be negative.");
  await requireOwnedProduct(productId, sellerId);
  return prisma.product.update({ where: { id: productId }, data: { stockQuantity } });
}

export async function addVariant(productId: string, sellerId: string, input: { name: string; optionType: string; optionValue: string; sku?: string; priceKobo: number; stockQuantity: number; isActive: boolean }) {
  await requireOwnedProduct(productId, sellerId);
  const variant = await prisma.productVariant.create({ data: { productId, name: input.name, options: { [input.optionType]: input.optionValue }, sku: input.sku || null, priceKobo: input.priceKobo, stockQuantity: input.stockQuantity, isActive: input.isActive } });
  await markMaterialEdit(productId, sellerId); return variant;
}

export async function deleteVariant(id: string, productId: string, sellerId: string) { await requireOwnedProduct(productId, sellerId); await prisma.productVariant.deleteMany({ where: { id, productId } }); await markMaterialEdit(productId, sellerId); }
export async function updateVariantAvailability(id: string, productId: string, sellerId: string, stockQuantity: number, isActive: boolean) {
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) throw new ProductAccessError("INVALID_STATE", "Variant stock cannot be negative.");
  await requireOwnedProduct(productId, sellerId);
  const variant = await prisma.productVariant.findFirst({ where: { id, productId } });
  if (!variant) throw new ProductAccessError("NOT_FOUND", "Variant not found.");
  await prisma.productVariant.update({ where: { id }, data: { stockQuantity, isActive } });
  if (variant.isActive !== isActive) await markMaterialEdit(productId, sellerId);
}

export async function addBulkTier(productId: string, sellerId: string, input: { minimumQuantity: number; maximumQuantity: number | null; unitPriceKobo: number }) {
  const product = await requireOwnedProduct(productId, sellerId);
  if (input.unitPriceKobo > product.basePriceKobo) throw new ProductAccessError("INVALID_STATE", "Bulk unit price cannot exceed the base price.");
  const tiers = product.bulkPriceTiers;
  if (tiers.some((tier) => rangesOverlap(input.minimumQuantity, input.maximumQuantity, tier.minimumQuantity, tier.maximumQuantity))) throw new ProductAccessError("INVALID_STATE", "Bulk quantity ranges cannot overlap.");
  const tier = await prisma.bulkPriceTier.create({ data: { productId, ...input } }); await markMaterialEdit(productId, sellerId); return tier;
}
export async function deleteBulkTier(id: string, productId: string, sellerId: string) { await requireOwnedProduct(productId, sellerId); await prisma.bulkPriceTier.deleteMany({ where: { id, productId } }); await markMaterialEdit(productId, sellerId); }

export function rangesOverlap(minA: number, maxA: number | null, minB: number, maxB: number | null) { return minA <= (maxB ?? Number.MAX_SAFE_INTEGER) && minB <= (maxA ?? Number.MAX_SAFE_INTEGER); }

export function listProductsForModeration() { return prisma.product.findMany({ include: { seller: { select: { email: true, username: true, sellerProfile: { select: { businessName: true } } } }, category: true, images: { where: { isPrimary: true }, take: 1 } }, orderBy: { updatedAt: "desc" } }); }
export function getProductForModeration(id: string) { return prisma.product.findUnique({ where: { id }, include: { ...includeCatalogue, seller: { include: { sellerProfile: true } }, moderatedBy: { select: { email: true } } } }); }
export function listPublishedProducts() { return prisma.product.findMany({ where: { status: "APPROVED", isPublished: true, category: { isActive: true, OR: [{ parentId: null }, { parent: { isActive: true } }] }, seller: { status: "ACTIVE", deletedAt: null, sellerProfile: { verificationStatus: "APPROVED" } } }, include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 }, seller: { select: { sellerProfile: { select: { businessName: true, state: true } } } } }, orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }] }); }
export function getPublishedProduct(id: string) { return prisma.product.findFirst({ where: { id, status: "APPROVED", isPublished: true, category: { isActive: true, OR: [{ parentId: null }, { parent: { isActive: true } }] }, seller: { status: "ACTIVE", deletedAt: null, sellerProfile: { verificationStatus: "APPROVED" } } }, include: { ...includeCatalogue, seller: { select: { sellerProfile: true } } } }); }

export async function moderateProduct(id: string, adminId: string, transition: "approve" | "reject" | "suspend" | "restore", reason?: string) {
  const rejectionReason = reason?.trim();
  if (transition === "reject" && (!rejectionReason || rejectionReason.length < 10)) {
    throw new ProductAccessError("INVALID_STATE", "Provide a clear rejection reason of at least 10 characters.");
  }
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id } });
    if (!product) throw new ProductAccessError("NOT_FOUND", "Product not found.");
    const allowed = { approve: ["PENDING_REVIEW"], reject: ["PENDING_REVIEW"], suspend: ["APPROVED"], restore: ["SUSPENDED"] }[transition];
    if (!allowed.includes(product.status)) throw new ProductAccessError("INVALID_STATE", `This product cannot be ${transition}d from its current state.`);
    const status = transition === "approve" || transition === "restore" ? "APPROVED" : transition === "reject" ? "REJECTED" : "SUSPENDED";
    return tx.product.update({ where: { id }, data: { status, isPublished: transition === "approve" ? product.isPublished : false, rejectionReason: transition === "reject" ? rejectionReason : null, moderatedAt: new Date(), moderatedByUserId: adminId } });
  });
}
