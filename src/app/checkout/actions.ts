"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/server/authorization";
import { createOrderFromCart, OrderError } from "@/server/orders";

export async function createOrderAction() {
  const user = await requireUser();
  let reference: string;

  try {
    const order = await createOrderFromCart(user.id);
    reference = order.reference;
  } catch (error) {
    const message =
      error instanceof OrderError
        ? error.message
        : "The order could not be created. Please review your cart and try again.";
    redirect(`/checkout?error=${encodeURIComponent(message)}`);
  }

  redirect(`/account/orders/${reference}`);
}
