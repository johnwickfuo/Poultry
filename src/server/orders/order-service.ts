import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";

import { reviewCartLine, type CartLine } from "@/server/cart/cart-service";
import { prisma } from "@/server/database/prisma";
import { getSettings } from "@/server/settings";

export class OrderError extends Error {
  constructor(
    public code:
      | "CART_NOT_FOUND"
      | "EMPTY_CART"
      | "INVALID_CART"
      | "PRICE_CHANGED"
      | "TOTAL_MISMATCH",
    message: string,
  ) {
    super(message);
    this.name = "OrderError";
  }
}

type OrderLineInput = {
  sellerId: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantLabel: string | null;
  sku: string | null;
  quantity: number;
  unitPriceKobo: number;
  productImagePath: string | null;
};

export type DeliveryQuote = {
  method: string;
  feeKobo: bigint;
};

export type OrderDraft = ReturnType<typeof buildOrderDraft>;

const orderCartInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: {
      variant: true,
      product: {
        include: {
          category: { include: { parent: true } },
          seller: { include: { sellerProfile: true } },
          images: {
            orderBy: [
              { isPrimary: "desc" as const },
              { sortOrder: "asc" as const },
            ],
            take: 1,
          },
          bulkPriceTiers: {
            orderBy: { minimumQuantity: "desc" as const },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

export const buyerOrderInclude = {
  subOrders: {
    orderBy: { createdAt: "asc" as const },
    include: {
      seller: {
        select: {
          username: true,
          sellerProfile: { select: { businessName: true, logoPath: true } },
        },
      },
      items: { orderBy: { id: "asc" as const } },
    },
  },
} satisfies Prisma.OrderInclude;

export type BuyerOrder = Prisma.OrderGetPayload<{
  include: typeof buyerOrderInclude;
}>;

export function generateOrderReference(now = new Date()) {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const entropy = randomBytes(6).toString("hex").toUpperCase();
  return `POU-${date}-${entropy}`;
}

export function commissionBasisPoints(percent: number) {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new OrderError("INVALID_CART", "The marketplace commission is invalid.");
  }
  return Math.round(percent * 100);
}

export function calculateCommissionKobo(
  subtotalKobo: bigint,
  basisPoints: number,
) {
  if (subtotalKobo < 0n || !Number.isInteger(basisPoints)) {
    throw new OrderError("INVALID_CART", "Order amounts must be valid integers.");
  }
  return (subtotalKobo * BigInt(basisPoints) + 5_000n) / 10_000n;
}

function checkedLineTotal(unitPriceKobo: number, quantity: number) {
  if (
    !Number.isSafeInteger(unitPriceKobo) ||
    unitPriceKobo < 0 ||
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    throw new OrderError("INVALID_CART", "Order amounts must be valid integers.");
  }
  return BigInt(unitPriceKobo) * BigInt(quantity);
}

export function buildOrderDraft(
  lines: readonly OrderLineInput[],
  commissionPercent: number,
  paymentGateway: string,
  deliveryQuotes: ReadonlyMap<string, DeliveryQuote> = new Map(),
) {
  if (!lines.length) throw new OrderError("EMPTY_CART", "Your cart is empty.");
  if (!paymentGateway.trim()) {
    throw new OrderError("INVALID_CART", "A payment gateway is required.");
  }

  const basisPoints = commissionBasisPoints(commissionPercent);
  const grouped = new Map<string, OrderLineInput[]>();
  for (const line of lines) {
    const sellerLines = grouped.get(line.sellerId) ?? [];
    sellerLines.push(line);
    grouped.set(line.sellerId, sellerLines);
  }

  const subOrders = [...grouped.entries()].map(([sellerId, sellerLines]) => {
    const items = sellerLines.map((line) => ({
      productId: line.productId,
      variantId: line.variantId,
      productName: line.productName,
      variantLabel: line.variantLabel,
      sku: line.sku,
      quantity: line.quantity,
      unitPriceKobo: BigInt(line.unitPriceKobo),
      lineTotalKobo: checkedLineTotal(line.unitPriceKobo, line.quantity),
      productImagePath: line.productImagePath,
    }));
    const subtotalKobo = items.reduce(
      (sum, item) => sum + item.lineTotalKobo,
      0n,
    );
    const commissionAmountKobo = calculateCommissionKobo(
      subtotalKobo,
      basisPoints,
    );
    const delivery = deliveryQuotes.get(sellerId) ?? {
      method: "PENDING_SELECTION",
      feeKobo: 0n,
    };
    if (delivery.feeKobo < 0n || !delivery.method.trim()) {
      throw new OrderError("INVALID_CART", "Delivery details are invalid.");
    }

    return {
      sellerId,
      subtotalKobo,
      commissionPercentSnapshot: (basisPoints / 100).toFixed(2),
      commissionAmountKobo,
      sellerPayoutAmountKobo: subtotalKobo - commissionAmountKobo,
      deliveryMethod: delivery.method,
      deliveryFeeKobo: delivery.feeKobo,
      items,
    };
  });

  const subtotalKobo = subOrders.reduce(
    (sum, subOrder) => sum + subOrder.subtotalKobo,
    0n,
  );
  const deliveryTotalKobo = subOrders.reduce(
    (sum, subOrder) => sum + subOrder.deliveryFeeKobo,
    0n,
  );
  const grandTotalKobo = subtotalKobo + deliveryTotalKobo;

  const itemTotal = subOrders.flatMap(({ items }) => items).reduce(
    (sum, item) => sum + item.lineTotalKobo,
    0n,
  );
  const subOrderGrandTotal = subOrders.reduce(
    (sum, subOrder) =>
      sum + subOrder.subtotalKobo + subOrder.deliveryFeeKobo,
    0n,
  );
  if (itemTotal !== subtotalKobo || subOrderGrandTotal !== grandTotalKobo) {
    throw new OrderError("TOTAL_MISMATCH", "Order totals do not reconcile.");
  }

  return {
    subtotalKobo,
    deliveryTotalKobo,
    grandTotalKobo,
    currency: "NGN" as const,
    paymentGateway: paymentGateway.trim(),
    subOrders,
  };
}

function lineSnapshot(line: CartLine): OrderLineInput {
  return {
    sellerId: line.product.sellerId,
    productId: line.productId,
    variantId: line.variantId,
    productName: line.product.name,
    variantLabel: line.variant?.name ?? null,
    sku: line.variant?.sku ?? line.product.sku,
    quantity: line.quantity,
    unitPriceKobo: line.unitPriceSnapshotKobo,
    productImagePath: line.product.images[0]?.path ?? null,
  };
}

export async function createOrderFromCart(userId: string) {
  const settings = await getSettings([
    "marketplace_commission_percent",
    "active_payment_gateway",
  ] as const);

  return prisma.$transaction(
    async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: orderCartInclude,
      });
      if (!cart) throw new OrderError("CART_NOT_FOUND", "Cart not found.");
      if (!cart.items.length) {
        throw new OrderError("EMPTY_CART", "Your cart is empty.");
      }

      const snapshots = cart.items.map((item) => {
        const review = reviewCartLine(item);
        if (review.issue) {
          throw new OrderError("INVALID_CART", review.issue);
        }
        if (review.priceChanged) {
          throw new OrderError(
            "PRICE_CHANGED",
            "A price changed. Review and accept current prices before ordering.",
          );
        }
        return lineSnapshot(item);
      });
      const draft = buildOrderDraft(
        snapshots,
        settings.marketplace_commission_percent,
        settings.active_payment_gateway,
      );

      const order = await tx.order.create({
        data: {
          userId,
          reference: generateOrderReference(),
          subtotalKobo: draft.subtotalKobo,
          deliveryTotalKobo: draft.deliveryTotalKobo,
          grandTotalKobo: draft.grandTotalKobo,
          currency: draft.currency,
          paymentGateway: draft.paymentGateway,
          subOrders: {
            create: draft.subOrders.map((subOrder) => ({
              sellerId: subOrder.sellerId,
              subtotalKobo: subOrder.subtotalKobo,
              commissionPercentSnapshot:
                subOrder.commissionPercentSnapshot,
              commissionAmountKobo: subOrder.commissionAmountKobo,
              sellerPayoutAmountKobo: subOrder.sellerPayoutAmountKobo,
              deliveryMethod: subOrder.deliveryMethod,
              deliveryFeeKobo: subOrder.deliveryFeeKobo,
              items: { create: subOrder.items },
            })),
          },
        },
        select: { id: true, reference: true },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return order;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export function listOrdersForBuyer(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: buyerOrderInclude,
  });
}

export function getOrderForBuyer(userId: string, reference: string) {
  return prisma.order.findFirst({
    where: { userId, reference },
    include: buyerOrderInclude,
  });
}

export const OrderService = {
  createFromCart: createOrderFromCart,
  listForBuyer: listOrdersForBuyer,
  getForBuyer: getOrderForBuyer,
};
