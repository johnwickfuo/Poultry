import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/database/prisma";
import { PaystackGateway } from "./paystack.server";
import { PaymentGatewayError, type PaymentGateway } from "./payment-gateway";

export class PaymentServiceError extends Error {
  constructor(public code: "ORDER_NOT_FOUND" | "ORDER_NOT_PAYABLE" | "ORDER_INVALID" | "AMOUNT_MISMATCH" | "CURRENCY_MISMATCH", message: string) { super(message); this.name = "PaymentServiceError"; }
}

const paymentOrderInclude = { subOrders: { select: { subtotalKobo: true, deliveryFeeKobo: true, status: true } }, user: { select: { email: true } } } satisfies Prisma.OrderInclude;
type PayableOrder = Prisma.OrderGetPayload<{ include: typeof paymentOrderInclude }>;

export function generatePaymentReference() { return `PAY-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(8).toString("hex").toUpperCase()}`; }

function assertPayableOrder(order: NonNullable<PayableOrder>) {
  if (order.status === "PAID" || order.status === "CANCELLED" || order.status === "REFUNDED") throw new PaymentServiceError("ORDER_NOT_PAYABLE", "This order cannot be paid.");
  if (order.grandTotalKobo <= 0n || order.currency !== "NGN" || !order.subOrders.length) throw new PaymentServiceError("ORDER_INVALID", "This order has an invalid payment total.");
  const delivery = order.subOrders.reduce((sum, item) => sum + item.deliveryFeeKobo, 0n);
  const subtotal = order.subOrders.reduce((sum, item) => sum + item.subtotalKobo, 0n);
  const invalidSubOrder = order.subOrders.some((item) => ["CANCELLED", "REJECTED", "REFUNDED"].includes(item.status));
  if (invalidSubOrder || subtotal + delivery !== order.grandTotalKobo || delivery !== order.deliveryTotalKobo || subtotal !== order.subtotalKobo) throw new PaymentServiceError("ORDER_INVALID", "This order's checkout state is no longer valid.");
}

function callbackUrl(reference: string) {
  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  if (!appUrl) throw new PaymentGatewayError("PROVIDER_UNAVAILABLE", "APP_URL is required for payments.");
  return `${appUrl}/payment/paystack/callback?reference=${encodeURIComponent(reference)}`;
}

export async function initializeOrderPayment(userId: string, orderReference: string, gateway: PaymentGateway = new PaystackGateway()) {
  const order = await prisma.order.findFirst({ where: { userId, reference: orderReference }, include: paymentOrderInclude });
  if (!order) throw new PaymentServiceError("ORDER_NOT_FOUND", "Order not found.");
  assertPayableOrder(order);
  if (gateway.provider !== "paystack" || order.paymentGateway !== "paystack") throw new PaymentGatewayError("PROVIDER_UNAVAILABLE", "The selected payment gateway is unavailable.");

  const internalReference = generatePaymentReference();
  const attempt = await prisma.paymentTransaction.create({ data: { orderId: order.id, provider: gateway.provider, internalReference, amountKobo: order.grandTotalKobo, currency: "NGN", status: "PENDING" }, select: { id: true } });
  try {
    const initialized = await gateway.initializeTransaction({ reference: internalReference, email: order.user.email, amountKobo: order.grandTotalKobo, currency: "NGN", callbackUrl: callbackUrl(internalReference), metadata: { orderId: order.id, orderReference: order.reference } });
    await prisma.paymentTransaction.update({ where: { id: attempt.id }, data: { gatewayReference: initialized.gatewayReference, status: "INITIALIZED", initializedAt: new Date() } });
    return { authorizationUrl: initialized.authorizationUrl, reference: internalReference };
  } catch (error) {
    await prisma.paymentTransaction.update({ where: { id: attempt.id }, data: { status: "FAILED", failureCode: error instanceof PaymentGatewayError ? error.code : "PROVIDER_UNAVAILABLE" } });
    throw error;
  }
}

export async function getPaymentResultForBuyer(userId: string, reference: string, gateway: PaymentGateway = new PaystackGateway()) {
  const attempt = await prisma.paymentTransaction.findFirst({ where: { internalReference: reference, order: { userId } }, include: { order: { select: { id: true, reference: true, grandTotalKobo: true, currency: true, status: true } } } });
  if (!attempt) throw new PaymentServiceError("ORDER_NOT_FOUND", "Payment attempt not found.");
  const transaction = await gateway.verifyTransaction(attempt.gatewayReference || attempt.internalReference);
  if (transaction.status === "FAILED") throw new PaymentGatewayError("FAILED_TRANSACTION", "The payment was not successful.");
  if (transaction.amountKobo !== attempt.order.grandTotalKobo) throw new PaymentGatewayError("AMOUNT_MISMATCH", "The verified payment amount does not match this order.");
  if (transaction.currency !== attempt.order.currency) throw new PaymentGatewayError("CURRENCY_MISMATCH", "The verified payment currency does not match this order.");
  if (transaction.metadata && (transaction.metadata.orderId !== attempt.order.id || transaction.metadata.orderReference !== attempt.order.reference)) throw new PaymentGatewayError("INVALID_RESPONSE", "The payment metadata does not match this order.");
  return { reference: attempt.internalReference, orderReference: attempt.order.reference, gatewayStatus: transaction.status, orderStatus: attempt.order.status, amountKobo: transaction.amountKobo, currency: transaction.currency };
}

export const PaymentService = { initializeOrderPayment, getPaymentResultForBuyer };
