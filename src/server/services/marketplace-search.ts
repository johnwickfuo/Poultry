import { Prisma } from "@prisma/client";

import { prisma } from "@/server/database/prisma";

export const MARKETPLACE_PAGE_SIZE = 12;
export const MARKETPLACE_ATTRIBUTE_KEYS = ["breed", "age", "pack_size", "presentation", "size", "weight", "sex"] as const;

export type MarketplaceAttributeKey = (typeof MARKETPLACE_ATTRIBUTE_KEYS)[number];
export type MarketplaceSort = "newest" | "price-asc" | "price-desc" | "popularity";
export type MarketplaceFilters = {
  q?: string;
  category?: string;
  subcategory?: string;
  species?: string;
  minPriceKobo?: number;
  maxPriceKobo?: number;
  condition?: string;
  seller?: string;
  inStock?: boolean;
  attributeKey?: MarketplaceAttributeKey;
  attributeValue?: string;
  sort?: MarketplaceSort;
  page?: number;
};

export const publicProductWhere = {
  status: "APPROVED",
  isPublished: true,
  category: { isActive: true, OR: [{ parentId: null }, { parent: { isActive: true } }] },
  seller: { status: "ACTIVE", deletedAt: null, sellerProfile: { verificationStatus: "APPROVED" } },
} satisfies Prisma.ProductWhereInput;

const marketplaceProductInclude = {
  category: { include: { parent: { select: { name: true, slug: true, imagePath: true } } } },
  images: { orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }], take: 1 },
  seller: { select: { username: true, sellerProfile: { select: { businessName: true, state: true, logoPath: true } } } },
  variants: { where: { isActive: true }, orderBy: { priceKobo: "asc" as const }, take: 3 },
  bulkPriceTiers: { orderBy: { minimumQuantity: "asc" as const }, take: 1 },
} satisfies Prisma.ProductInclude;

function cleanSearch(value?: string) {
  return value?.trim().replace(/\s+/g, " ").slice(0, 120) || undefined;
}

async function fullTextProductIds(query: string) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id
    FROM Product
    WHERE MATCH(name, shortDescription, description, brand, species)
      AGAINST (${query} IN NATURAL LANGUAGE MODE)
    LIMIT 2000
  `);
  return rows.map((row) => row.id);
}

async function attributeProductIds(key: MarketplaceAttributeKey, value: string) {
  const path = `$."${key}"`;
  const rows = await prisma.$queryRaw<Array<{ productId: string }>>(Prisma.sql`
    SELECT DISTINCT productId
    FROM ProductVariant
    WHERE isActive = true
      AND JSON_UNQUOTE(JSON_EXTRACT(options, ${path})) = ${value}
  `);
  return rows.map((row) => row.productId);
}

export function marketplaceOrderBy(sort: MarketplaceSort = "newest"): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === "price-asc") return [{ basePriceKobo: "asc" }, { createdAt: "desc" }];
  if (sort === "price-desc") return [{ basePriceKobo: "desc" }, { createdAt: "desc" }];
  if (sort === "popularity") return [{ isFeatured: "desc" }, { updatedAt: "desc" }, { createdAt: "desc" }];
  return [{ createdAt: "desc" }];
}

async function buildWhere(filters: MarketplaceFilters): Promise<Prisma.ProductWhereInput> {
  const clauses: Prisma.ProductWhereInput[] = [publicProductWhere];
  const query = cleanSearch(filters.q);
  if (query) clauses.push({ id: { in: await fullTextProductIds(query) } });
  if (filters.subcategory) clauses.push({ category: { slug: filters.subcategory, isActive: true, parent: { isActive: true, ...(filters.category ? { slug: filters.category } : {}) } } });
  else if (filters.category) clauses.push({ category: { isActive: true, OR: [{ slug: filters.category, parentId: null }, { parent: { slug: filters.category, isActive: true } }] } });
  if (filters.species) clauses.push({ species: filters.species });
  if (filters.condition) clauses.push({ condition: filters.condition });
  if (filters.seller) clauses.push({ seller: { username: filters.seller, status: "ACTIVE", sellerProfile: { verificationStatus: "APPROVED" } } });
  if (filters.minPriceKobo !== undefined || filters.maxPriceKobo !== undefined) {
    const range = { gte: filters.minPriceKobo, lte: filters.maxPriceKobo };
    clauses.push({ OR: [{ basePriceKobo: range }, { variants: { some: { isActive: true, priceKobo: range } } }] });
  }
  if (filters.inStock) clauses.push({ OR: [{ stockQuantity: { gt: 0 } }, { variants: { some: { isActive: true, stockQuantity: { gt: 0 } } } }] });
  if (filters.attributeKey && filters.attributeValue) clauses.push({ id: { in: await attributeProductIds(filters.attributeKey, filters.attributeValue) } });
  return { AND: clauses };
}

export async function searchMarketplace(filters: MarketplaceFilters = {}) {
  const requestedPage = Math.max(1, Math.floor(filters.page || 1));
  const where = await buildWhere(filters);
  const total = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / MARKETPLACE_PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const products = await prisma.product.findMany({ where, include: marketplaceProductInclude, orderBy: marketplaceOrderBy(filters.sort), skip: (page - 1) * MARKETPLACE_PAGE_SIZE, take: MARKETPLACE_PAGE_SIZE });
  return { products, total, page, totalPages };
}

export async function getMarketplaceFacets() {
  const [products, variants] = await Promise.all([
    prisma.product.findMany({ where: publicProductWhere, select: { species: true, condition: true, seller: { select: { username: true, sellerProfile: { select: { businessName: true } } } } }, take: 2000 }),
    prisma.productVariant.findMany({ where: { isActive: true, product: publicProductWhere }, select: { options: true }, take: 2000 }),
  ]);
  const unique = (values: Array<string | null | undefined>) => [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));
  const attributes = new Map<MarketplaceAttributeKey, Set<string>>();
  for (const key of MARKETPLACE_ATTRIBUTE_KEYS) attributes.set(key, new Set());
  for (const variant of variants) {
    if (!variant.options || Array.isArray(variant.options) || typeof variant.options !== "object") continue;
    for (const key of MARKETPLACE_ATTRIBUTE_KEYS) {
      const value = (variant.options as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim()) attributes.get(key)?.add(value.trim());
    }
  }
  return {
    species: unique(products.map((product) => product.species)),
    conditions: unique(products.map((product) => product.condition)),
    sellers: [...new Map(products.map((product) => [product.seller.username, { slug: product.seller.username, name: product.seller.sellerProfile?.businessName || product.seller.username }])).values()].sort((a, b) => a.name.localeCompare(b.name)),
    attributes: MARKETPLACE_ATTRIBUTE_KEYS.flatMap((key) => [...(attributes.get(key) || [])].sort().map((value) => ({ key, value }))),
  };
}

export function getFeaturedMarketplaceProducts(take = 4) {
  return prisma.product.findMany({ where: { ...publicProductWhere, isFeatured: true }, include: marketplaceProductInclude, orderBy: { updatedAt: "desc" }, take });
}

export function getRecentMarketplaceProducts(take = 4) {
  return prisma.product.findMany({ where: publicProductWhere, include: marketplaceProductInclude, orderBy: { createdAt: "desc" }, take });
}

export function getFeaturedSellers(take = 4) {
  return prisma.user.findMany({
    where: { status: "ACTIVE", deletedAt: null, sellerProfile: { verificationStatus: "APPROVED" }, products: { some: publicProductWhere } },
    select: { username: true, sellerProfile: true, _count: { select: { products: { where: publicProductWhere } } } },
    orderBy: { products: { _count: "desc" } },
    take,
  });
}

export function getMarketplaceProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { ...publicProductWhere, slug },
    include: {
      category: { include: { parent: true } },
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      variants: { where: { isActive: true }, orderBy: { priceKobo: "asc" } },
      bulkPriceTiers: { orderBy: { minimumQuantity: "asc" } },
      seller: { select: { username: true, sellerProfile: true } },
    },
  });
}

export function getRelatedMarketplaceProducts(productId: string, categoryId: string, take = 4) {
  return prisma.product.findMany({ where: { ...publicProductWhere, categoryId, id: { not: productId } }, include: marketplaceProductInclude, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }], take });
}

export function getPublicSellerStorefront(sellerSlug: string) {
  return prisma.user.findFirst({
    where: { username: sellerSlug, status: "ACTIVE", deletedAt: null, sellerProfile: { verificationStatus: "APPROVED" } },
    select: { username: true, createdAt: true, sellerProfile: true },
  });
}

export function getPublicSellerProducts(sellerSlug: string, page = 1) {
  return searchMarketplace({ seller: sellerSlug, page });
}
