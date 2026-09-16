"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireApprovedSeller } from "@/server/authorization";
import { deleteSellerDeliveryRate, saveSellerDeliveryRate, setSellerDeliveryRateActive, updateSellerPickupSettings } from "@/server/delivery";
import { pickupSettingsSchema, sellerDeliveryRateSchema } from "@/server/validation/delivery";

function destination(message: string, error = false) {
  revalidatePath("/seller/delivery-settings");
  redirect(`/seller/delivery-settings?${error ? "error" : "message"}=${encodeURIComponent(message)}`);
}

export async function saveDeliveryRateAction(formData: FormData) {
  const user = await requireApprovedSeller();
  const parsed = sellerDeliveryRateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) destination(parsed.error.issues[0]?.message || "Enter a valid state delivery rate.", true);
  const input = parsed.data!;
  await saveSellerDeliveryRate(user.id, input.state, input.feeKobo);
  destination(`Delivery rate for ${input.state} saved.`);
}

export async function setDeliveryRateActiveAction(rateId: string, active: boolean) {
  const user = await requireApprovedSeller();
  await setSellerDeliveryRateActive(user.id, rateId, active);
  destination(active ? "Delivery rate activated." : "Delivery rate deactivated.");
}

export async function deleteDeliveryRateAction(rateId: string) {
  const user = await requireApprovedSeller();
  await deleteSellerDeliveryRate(user.id, rateId);
  destination("Delivery rate deleted.");
}

export async function updatePickupSettingsAction(formData: FormData) {
  const user = await requireApprovedSeller();
  const parsed = pickupSettingsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) destination(parsed.error.issues[0]?.message || "Check the pickup settings.", true);
  const input = parsed.data!;
  await updateSellerPickupSettings(user.id, {
    buyerPickupEnabled: input.buyerPickupEnabled,
    pickupState: input.pickupState || null,
    pickupLga: input.pickupLga || null,
    pickupAddress: input.pickupAddress || null,
    pickupInstructions: input.pickupInstructions || null,
  });
  destination("Buyer pickup settings updated.");
}
