"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/server/authorization";
import { DeliveryError } from "@/server/delivery";
import { createOrderFromCart, OrderError } from "@/server/orders";
import { initializeOrderPayment, PaymentGatewayError, PaymentServiceError } from "@/server/payments";
import { deliveryMethodSchema, nigerianStateSchema } from "@/server/validation/delivery";

export async function createOrderAction(formData: FormData) {
  const user = await requireUser();
  let reference: string;

  const state = nigerianStateSchema.safeParse(formData.get("buyerState"));
  if (!state.success) redirect(`/checkout?error=${encodeURIComponent("Select a valid Nigerian delivery state.")}`);
  const selections: Record<string, "SELLER_ARRANGED" | "BUYER_PICKUP" | "QUOTE_REQUIRED"> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("deliveryMethod:")) continue;
    const method = deliveryMethodSchema.safeParse(value);
    if (method.success) selections[key.slice("deliveryMethod:".length)] = method.data;
  }

  try {
    const order = await createOrderFromCart(user.id, { buyerState: state.data, selections });
    reference = order.reference;
  } catch (error) {
    const message =
      error instanceof OrderError || error instanceof DeliveryError
        ? error.message
        : "The order could not be created. Please review your cart and try again.";
    redirect(`/checkout?error=${encodeURIComponent(message)}`);
  }

  try {
    const payment = await initializeOrderPayment(user.id, reference);
    redirect(payment.authorizationUrl);
  } catch (error) {
    const message = error instanceof PaymentGatewayError || error instanceof PaymentServiceError ? error.message : "Order created, but payment could not be initialized.";
    redirect(`/account/orders/${reference}?error=${encodeURIComponent(message)}`);
  }
}

export async function startOrderPaymentAction(formData: FormData) {
  const user = await requireUser();
  const reference = formData.get("orderReference");
  if (typeof reference !== "string" || !reference) redirect("/account/orders");
  try {
    const payment = await initializeOrderPayment(user.id, reference);
    redirect(payment.authorizationUrl);
  } catch (error) {
    const message = error instanceof PaymentGatewayError || error instanceof PaymentServiceError ? error.message : "Payment could not be initialized.";
    redirect(`/account/orders/${reference}?error=${encodeURIComponent(message)}`);
  }
}
