import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/database/prisma";

export class CartError extends Error {
  constructor(public code: "NOT_FOUND" | "UNAVAILABLE" | "INVALID_QUANTITY" | "OUT_OF_STOCK" | "PRICE_CHANGED", message: string) { super(message); this.name = "CartError"; }
}

const lineInclude = {
  variant: true,
  product: {
    include: {
      category: { include: { parent: true } },
      seller: { include: { sellerProfile: true } },
      images: { orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }], take: 1 },
      bulkPriceTiers: { orderBy: { minimumQuantity: "desc" as const } },
    },
  },
} satisfies Prisma.CartItemInclude;

const cartInclude = { items: { include: lineInclude, orderBy: { createdAt: "asc" as const } } } satisfies Prisma.CartInclude;
export type CartLine = Prisma.CartItemGetPayload<{ include: typeof lineInclude }>;

export type CartLineReview = CartLine & { currentUnitPriceKobo: number; priceChanged: boolean; issue: string | null; availableStock: number };

function currentUnitPrice(line: CartLine) {
  const standard = line.variant?.priceKobo ?? line.product.basePriceKobo;
  const tier = line.product.bulkPriceTiers.find((item) => line.quantity >= item.minimumQuantity && (item.maximumQuantity === null || line.quantity <= item.maximumQuantity));
  return tier?.unitPriceKobo ?? standard;
}

export function reviewCartLine(line: CartLine): CartLineReview {
  const product = line.product;
  const publicProduct = product.status === "APPROVED" && product.isPublished && product.category.isActive && (!product.category.parent || product.category.parent.isActive) && product.seller.status === "ACTIVE" && !product.seller.deletedAt && product.seller.sellerProfile?.verificationStatus === "APPROVED";
  const variantValid = !line.variantId || Boolean(line.variant && line.variant.productId === product.id && line.variant.isActive);
  const availableStock = line.variant ? line.variant.stockQuantity : product.stockQuantity;
  let issue: string | null = null;
  if (!publicProduct) issue = "This product is no longer available from an active approved seller.";
  else if (!variantValid) issue = "The selected variant is no longer available.";
  else if (line.quantity < product.minimumOrderQuantity) issue = `Minimum order is ${product.minimumOrderQuantity} ${product.unitLabel}${product.minimumOrderQuantity === 1 ? "" : "s"}.`;
  else if (line.quantity > availableStock) issue = availableStock > 0 ? `Only ${availableStock} ${product.unitLabel}${availableStock === 1 ? "" : "s"} remain in stock.` : "This item is out of stock.";
  const currentUnitPriceKobo = currentUnitPrice(line);
  return { ...line, currentUnitPriceKobo, priceChanged: currentUnitPriceKobo !== line.unitPriceSnapshotKobo, issue, availableStock };
}

async function purchasableLine(productId: string, variantId: string | null, quantity: number): Promise<CartLine> {
  if (!Number.isInteger(quantity) || quantity < 1) throw new CartError("INVALID_QUANTITY", "Enter a valid whole-number quantity.");
  const product = await prisma.product.findUnique({ where: { id: productId }, include: lineInclude.product.include });
  if (!product) throw new CartError("NOT_FOUND", "Product not found.");
  const variant = variantId ? await prisma.productVariant.findFirst({ where: { id: variantId, productId } }) : null;
  const synthetic = { id: "", cartId: "", productId, variantId, variantKey: variantId || "", quantity, unitPriceSnapshotKobo: 0, createdAt: new Date(), updatedAt: new Date(), product, variant } satisfies CartLine;
  const review = reviewCartLine(synthetic);
  if (review.issue) {
    const code = review.issue.includes("stock") ? "OUT_OF_STOCK" : review.issue.includes("Minimum") ? "INVALID_QUANTITY" : "UNAVAILABLE";
    throw new CartError(code, review.issue);
  }
  return { ...synthetic, unitPriceSnapshotKobo: review.currentUnitPriceKobo };
}

export function findCartByUser(userId: string) { return prisma.cart.findUnique({ where: { userId }, include: cartInclude }); }
export function findCartByGuestHash(guestTokenHash: string) { return prisma.cart.findUnique({ where: { guestTokenHash }, include: cartInclude }); }
export function createUserCart(userId: string) { return prisma.cart.upsert({ where: { userId }, create: { userId }, update: {}, include: cartInclude }); }
export function createGuestCart(guestTokenHash: string) { return prisma.cart.upsert({ where: { guestTokenHash }, create: { guestTokenHash }, update: {}, include: cartInclude }); }

export async function addCartItem(cartId: string, productId: string, variantId: string | null, quantity: number) {
  const variantKey = variantId || "";
  const existing = await prisma.cartItem.findUnique({ where: { cartId_productId_variantKey: { cartId, productId, variantKey } } });
  const nextQuantity = (existing?.quantity || 0) + quantity;
  const checked = await purchasableLine(productId, variantId, nextQuantity);
  return prisma.cartItem.upsert({ where: { cartId_productId_variantKey: { cartId, productId, variantKey } }, create: { cartId, productId, variantId, variantKey, quantity: nextQuantity, unitPriceSnapshotKobo: checked.unitPriceSnapshotKobo }, update: { quantity: nextQuantity } });
}

export async function updateCartItem(cartId: string, itemId: string, quantity: number) {
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId } });
  if (!item) throw new CartError("NOT_FOUND", "Cart item not found.");
  await purchasableLine(item.productId, item.variantId, quantity);
  return prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
}

export function removeCartItem(cartId: string, itemId: string) { return prisma.cartItem.deleteMany({ where: { id: itemId, cartId } }); }
export function clearCart(cartId: string) { return prisma.cartItem.deleteMany({ where: { cartId } }); }

export async function reviewCart(cartId: string) {
  const cart = await prisma.cart.findUnique({ where: { id: cartId }, include: cartInclude });
  if (!cart) return null;
  const items = cart.items.map(reviewCartLine);
  return { ...cart, items, itemCount: items.reduce((sum, item) => sum + item.quantity, 0), snapshotSubtotalKobo: items.reduce((sum, item) => sum + item.unitPriceSnapshotKobo * item.quantity, 0), currentSubtotalKobo: items.reduce((sum, item) => sum + item.currentUnitPriceKobo * item.quantity, 0), hasPriceChanges: items.some((item) => item.priceChanged), hasBlockingIssues: items.some((item) => Boolean(item.issue)) };
}

export async function acceptCurrentCartPrices(cartId: string) {
  const review = await reviewCart(cartId);
  if (!review) throw new CartError("NOT_FOUND", "Cart not found.");
  if (review.hasBlockingIssues) throw new CartError("UNAVAILABLE", "Resolve unavailable items and stock issues before continuing.");
  const changed = review.items.filter((item) => item.priceChanged);
  if (changed.length) await prisma.$transaction(changed.map((item) => prisma.cartItem.update({ where: { id: item.id }, data: { unitPriceSnapshotKobo: item.currentUnitPriceKobo } })));
  return changed.length;
}

export async function mergeGuestCartIntoUser(userId: string, guestTokenHash: string) {
  await prisma.$transaction(async (tx) => {
    const guestCart = await tx.cart.findUnique({ where: { guestTokenHash }, include: { items: true } });
    if (!guestCart) return;
    const userCart = await tx.cart.upsert({ where: { userId }, create: { userId }, update: {} });
    for (const item of guestCart.items) {
      await tx.cartItem.upsert({ where: { cartId_productId_variantKey: { cartId: userCart.id, productId: item.productId, variantKey: item.variantKey } }, create: { cartId: userCart.id, productId: item.productId, variantId: item.variantId, variantKey: item.variantKey, quantity: item.quantity, unitPriceSnapshotKobo: item.unitPriceSnapshotKobo }, update: { quantity: { increment: item.quantity } } });
    }
    await tx.cart.delete({ where: { id: guestCart.id } });
  });
}
