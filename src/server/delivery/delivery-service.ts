import type { DeliveryMethod, Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/server/database/prisma";
import { getSetting } from "@/server/settings";
import type { CheckoutDeliveryInput } from "@/server/validation/delivery";
import { nigerianStateSchema } from "@/server/validation/delivery";

type DeliveryDatabase = Prisma.TransactionClient | PrismaClient;

export class DeliveryError extends Error {
  constructor(
    public code: "INVALID_STATE" | "MISSING_RATE" | "PICKUP_UNAVAILABLE" | "QUOTE_DISABLED" | "INVALID_SELECTION" | "FORBIDDEN",
    message: string,
  ) {
    super(message);
    this.name = "DeliveryError";
  }
}

export type ResolvedDelivery = {
  method: DeliveryMethod;
  feeKobo: bigint;
  deliveryState: string | null;
  pickupAddressSnapshot: string | null;
  pickupInstructionsSnapshot: string | null;
  createQuoteRequest: boolean;
};

const sellerDeliverySelect = {
  id: true,
  username: true,
  status: true,
  deletedAt: true,
  sellerProfile: {
    select: {
      businessName: true,
      verificationStatus: true,
      buyerPickupEnabled: true,
      pickupState: true,
      pickupLga: true,
      pickupAddress: true,
      pickupInstructions: true,
    },
  },
  sellerDeliveryRates: {
    where: { isActive: true },
    select: { state: true, feeKobo: true },
  },
} satisfies Prisma.UserSelect;

export async function getSellerDeliveryConfiguration(sellerId: string) {
  return prisma.user.findFirst({
    where: { id: sellerId, status: "ACTIVE", deletedAt: null, sellerProfile: { verificationStatus: "APPROVED" } },
    select: {
      sellerProfile: { select: { buyerPickupEnabled: true, pickupState: true, pickupLga: true, pickupAddress: true, pickupInstructions: true } },
      sellerDeliveryRates: { orderBy: { state: "asc" } },
    },
  });
}

export function saveSellerDeliveryRate(sellerId: string, state: string, feeKobo: bigint) {
  const validState = nigerianStateSchema.parse(state);
  if (feeKobo < 0n) throw new DeliveryError("INVALID_SELECTION", "Delivery fee cannot be negative.");
  return prisma.sellerDeliveryRate.upsert({
    where: { sellerId_state: { sellerId, state: validState } },
    create: { sellerId, state: validState, feeKobo },
    update: { feeKobo },
  });
}

export async function setSellerDeliveryRateActive(sellerId: string, rateId: string, isActive: boolean) {
  const result = await prisma.sellerDeliveryRate.updateMany({ where: { id: rateId, sellerId }, data: { isActive } });
  if (!result.count) throw new DeliveryError("FORBIDDEN", "Delivery rate not found.");
}

export async function deleteSellerDeliveryRate(sellerId: string, rateId: string) {
  const result = await prisma.sellerDeliveryRate.deleteMany({ where: { id: rateId, sellerId } });
  if (!result.count) throw new DeliveryError("FORBIDDEN", "Delivery rate not found.");
}

export function updateSellerPickupSettings(sellerId: string, input: { buyerPickupEnabled: boolean; pickupState: string | null; pickupLga: string | null; pickupAddress: string | null; pickupInstructions: string | null }) {
  return prisma.sellerProfile.update({ where: { userId: sellerId }, data: input });
}

function assertApprovedSeller(seller: Awaited<ReturnType<typeof loadSellers>>[number] | undefined) {
  if (!seller || seller.status !== "ACTIVE" || seller.deletedAt || seller.sellerProfile?.verificationStatus !== "APPROVED") {
    throw new DeliveryError("INVALID_SELECTION", "A seller in this cart is no longer available.");
  }
  return seller;
}

function loadSellers(database: DeliveryDatabase, sellerIds: readonly string[]) {
  return database.user.findMany({ where: { id: { in: [...sellerIds] } }, select: sellerDeliverySelect });
}

export async function getCheckoutDeliveryOptions(sellerIds: readonly string[], buyerState: string | null) {
  const state = buyerState ? nigerianStateSchema.safeParse(buyerState) : null;
  const [sellers, quoteEnabled] = await Promise.all([
    loadSellers(prisma, sellerIds),
    getSetting("delivery_quote_enabled"),
  ]);
  return sellerIds.map((sellerId) => {
    const seller = assertApprovedSeller(sellers.find(({ id }) => id === sellerId));
    const profile = seller.sellerProfile!;
    const rate = state?.success ? seller.sellerDeliveryRates.find((item) => item.state === state.data) : undefined;
    return {
      sellerId,
      sellerName: profile.businessName || seller.username,
      pickupArea: profile.buyerPickupEnabled && profile.pickupState && profile.pickupLga ? `${profile.pickupLga}, ${profile.pickupState}` : null,
      options: [
        ...(rate ? [{ method: "SELLER_ARRANGED" as const, feeKobo: Number(rate.feeKobo), label: `Seller delivery to ${rate.state}` }] : []),
        ...(profile.buyerPickupEnabled && profile.pickupAddress && profile.pickupState && profile.pickupLga ? [{ method: "BUYER_PICKUP" as const, feeKobo: 0, label: `Buyer pickup in ${profile.pickupLga}, ${profile.pickupState}` }] : []),
        ...(quoteEnabled ? [{ method: "QUOTE_REQUIRED" as const, feeKobo: 0, label: "Request a delivery quote" }] : []),
      ],
      missingRate: Boolean(state?.success && !rate),
    };
  });
}

export async function validateDeliverySelections(
  sellerIds: readonly string[],
  input: CheckoutDeliveryInput,
  database: DeliveryDatabase = prisma,
) {
  const buyerState = nigerianStateSchema.safeParse(input.buyerState);
  if (!buyerState.success) throw new DeliveryError("INVALID_STATE", "Select a valid Nigerian delivery state.");
  const [sellers, quoteEnabled] = await Promise.all([
    loadSellers(database, sellerIds),
    getSetting("delivery_quote_enabled"),
  ]);
  const resolutions = new Map<string, ResolvedDelivery>();

  for (const sellerId of sellerIds) {
    const seller = assertApprovedSeller(sellers.find(({ id }) => id === sellerId));
    const profile = seller.sellerProfile!;
    const method = input.selections[sellerId];
    if (!method) throw new DeliveryError("INVALID_SELECTION", `Choose a delivery method for ${profile.businessName || seller.username}.`);

    if (method === "SELLER_ARRANGED") {
      const rate = seller.sellerDeliveryRates.find(({ state }) => state === buyerState.data);
      if (!rate) throw new DeliveryError("MISSING_RATE", `${profile.businessName || seller.username} has no active delivery rate for ${buyerState.data}. Choose pickup where available.`);
      resolutions.set(sellerId, { method, feeKobo: rate.feeKobo, deliveryState: buyerState.data, pickupAddressSnapshot: null, pickupInstructionsSnapshot: null, createQuoteRequest: false });
      continue;
    }

    if (method === "BUYER_PICKUP") {
      if (!profile.buyerPickupEnabled || !profile.pickupAddress || !profile.pickupState || !profile.pickupLga) {
        throw new DeliveryError("PICKUP_UNAVAILABLE", `${profile.businessName || seller.username} does not currently offer buyer pickup.`);
      }
      resolutions.set(sellerId, {
        method,
        feeKobo: 0n,
        deliveryState: null,
        pickupAddressSnapshot: [profile.pickupAddress, profile.pickupLga, profile.pickupState].join(", "),
        pickupInstructionsSnapshot: profile.pickupInstructions || null,
        createQuoteRequest: false,
      });
      continue;
    }

    if (!quoteEnabled) throw new DeliveryError("QUOTE_DISABLED", "Quote-required delivery is not currently available.");
    resolutions.set(sellerId, { method, feeKobo: 0n, deliveryState: buyerState.data, pickupAddressSnapshot: null, pickupInstructionsSnapshot: null, createQuoteRequest: true });
  }

  return resolutions;
}

export interface DeliveryQuoteWorkflow {
  requestForSubOrder(buyerId: string, subOrderId: string): Promise<{ id: string }>;
  provideQuote(sellerId: string, requestId: string, amountKobo: bigint, note?: string): Promise<void>;
  acceptQuote(buyerId: string, requestId: string): Promise<void>;
  recordTopUpPayment(requestId: string, gateway: string, gatewayReference: string): Promise<void>;
}

async function requireQuoteEnabled() {
  if (!await getSetting("delivery_quote_enabled")) {
    throw new DeliveryError("QUOTE_DISABLED", "Quote-required delivery is not currently available.");
  }
}

export async function requestDeliveryQuote(buyerId: string, subOrderId: string) {
  await requireQuoteEnabled();
  const subOrder = await prisma.subOrder.findFirst({
    where: { id: subOrderId, deliveryMethod: "QUOTE_REQUIRED", order: { userId: buyerId } },
    select: { id: true },
  });
  if (!subOrder) throw new DeliveryError("FORBIDDEN", "Delivery quote request not found.");
  return prisma.deliveryQuoteRequest.upsert({
    where: { subOrderId },
    create: { subOrderId },
    update: { status: "REQUESTED", sellerAmountKobo: null, sellerNote: null, quotedAt: null, expiresAt: null, acceptedAt: null },
    select: { id: true },
  });
}

export async function provideDeliveryQuote(sellerId: string, requestId: string, amountKobo: bigint, note?: string) {
  await requireQuoteEnabled();
  if (amountKobo < 0n) throw new DeliveryError("INVALID_SELECTION", "Delivery quote amount cannot be negative.");
  const request = await prisma.deliveryQuoteRequest.findFirst({
    where: { id: requestId, subOrder: { sellerId } },
    select: { id: true },
  });
  if (!request) throw new DeliveryError("FORBIDDEN", "Delivery quote request not found.");
  const validityDays = await getSetting("quote_validity_days");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);
  await prisma.deliveryQuoteRequest.update({
    where: { id: request.id },
    data: { status: "QUOTED", sellerAmountKobo: amountKobo, sellerNote: note?.trim() || null, quotedAt: now, expiresAt },
  });
}

export async function acceptDeliveryQuote(buyerId: string, requestId: string) {
  await requireQuoteEnabled();
  const request = await prisma.deliveryQuoteRequest.findFirst({
    where: { id: requestId, status: "QUOTED", subOrder: { order: { userId: buyerId } } },
    select: { id: true, expiresAt: true },
  });
  if (!request) throw new DeliveryError("FORBIDDEN", "Delivery quote request not found.");
  if (!request.expiresAt || request.expiresAt <= new Date()) throw new DeliveryError("INVALID_SELECTION", "This delivery quote has expired.");
  await prisma.deliveryQuoteRequest.update({ where: { id: request.id }, data: { status: "ACCEPTED", acceptedAt: new Date() } });
}

export async function recordDeliveryQuoteTopUpPayment(requestId: string, gateway: string, gatewayReference: string) {
  const request = await prisma.deliveryQuoteRequest.findFirst({ where: { id: requestId, status: "ACCEPTED" }, select: { id: true } });
  if (!request) throw new DeliveryError("INVALID_SELECTION", "Delivery quote is not ready for payment.");
  await prisma.deliveryQuoteRequest.update({ where: { id: request.id }, data: { status: "TOP_UP_PAID", topUpPaymentGateway: gateway.trim(), topUpGatewayReference: gatewayReference.trim(), topUpPaidAt: new Date() } });
}

export function canRevealPickupDetails(order: { paidAt: Date | null; status: string }) {
  return Boolean(order.paidAt) && !["PENDING_PAYMENT", "CANCELLED"].includes(order.status);
}

export const DeliveryService = {
  getSellerConfiguration: getSellerDeliveryConfiguration,
  saveRate: saveSellerDeliveryRate,
  setRateActive: setSellerDeliveryRateActive,
  deleteRate: deleteSellerDeliveryRate,
  updatePickup: updateSellerPickupSettings,
  getCheckoutOptions: getCheckoutDeliveryOptions,
  validateSelections: validateDeliverySelections,
  requestQuote: requestDeliveryQuote,
  provideQuote: provideDeliveryQuote,
  acceptQuote: acceptDeliveryQuote,
  recordQuoteTopUpPayment: recordDeliveryQuoteTopUpPayment,
};
