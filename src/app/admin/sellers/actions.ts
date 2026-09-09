"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole, ROLE_NAMES } from "@/server/authorization";
import { approveSellerApplication, rejectSellerApplication, restoreSellerApplication, SellerWorkflowError, suspendSellerApplication } from "@/server/services/seller-onboarding";
import { rejectionSchema } from "@/server/validation/seller";

async function adminId() {
  return (await requireRole(ROLE_NAMES.ADMIN)).id;
}

function destination(id: string, message: string, error = false): never {
  revalidatePath("/admin/sellers");
  revalidatePath(`/admin/sellers/${id}`);
  revalidatePath("/seller");
  redirect(`/admin/sellers/${id}?${error ? "error" : "message"}=${encodeURIComponent(message)}`);
}

export async function approveSellerAction(id: string) {
  const userId = await adminId();
  try { await approveSellerApplication(id, userId); }
  catch (error) { destination(id, error instanceof SellerWorkflowError ? error.message : "Unable to approve this application.", true); }
  destination(id, "Seller approved and seller role assigned.");
}

export async function rejectSellerAction(id: string, formData: FormData) {
  await adminId();
  const parsed = rejectionSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) destination(id, parsed.error.issues[0]?.message || "Enter a rejection reason.", true);
  try { await rejectSellerApplication(id, parsed.data.reason); }
  catch (error) { destination(id, error instanceof SellerWorkflowError ? error.message : "Unable to reject this application.", true); }
  destination(id, "Application rejected and seller access revoked.");
}

export async function suspendSellerAction(id: string) {
  await adminId();
  try { await suspendSellerApplication(id); }
  catch (error) { destination(id, error instanceof SellerWorkflowError ? error.message : "Unable to suspend this seller.", true); }
  destination(id, "Seller suspended and seller access revoked.");
}

export async function restoreSellerAction(id: string) {
  const userId = await adminId();
  try { await restoreSellerApplication(id, userId); }
  catch (error) { destination(id, error instanceof SellerWorkflowError ? error.message : "Unable to restore this seller.", true); }
  destination(id, "Seller restored and seller role reassigned.");
}
