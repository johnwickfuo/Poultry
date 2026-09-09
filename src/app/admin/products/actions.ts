"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole, ROLE_NAMES } from "@/server/authorization";
import { moderateProduct, ProductAccessError } from "@/server/services/product-catalogue";
import { productRejectionSchema } from "@/server/validation/product";

async function adminId() { return (await requireRole(ROLE_NAMES.ADMIN)).id; }
function done(id: string, message: string, error = false): never { revalidatePath("/admin/products"); revalidatePath(`/admin/products/${id}`); revalidatePath("/seller/products"); redirect(`/admin/products/${id}?${error ? "error" : "message"}=${encodeURIComponent(message)}`); }
async function transition(id: string, kind: "approve" | "suspend" | "restore") { const userId = await adminId(); try { await moderateProduct(id, userId, kind); } catch (error) { done(id, error instanceof ProductAccessError ? error.message : "Unable to moderate product.", true); } done(id, `Product ${kind === "approve" ? "approved" : kind === "suspend" ? "suspended" : "restored"}.`); }
export async function approveProductAction(id: string) { return transition(id, "approve"); }
export async function suspendProductAction(id: string) { return transition(id, "suspend"); }
export async function restoreProductAction(id: string) { return transition(id, "restore"); }
export async function rejectProductAction(id: string, formData: FormData) { const userId = await adminId(); const parsed = productRejectionSchema.safeParse({ reason: formData.get("reason") }); if (!parsed.success) done(id, "Enter a clear rejection reason of at least 10 characters.", true); try { await moderateProduct(id, userId, "reject", parsed.data.reason); } catch (error) { done(id, error instanceof ProductAccessError ? error.message : "Unable to reject product.", true); } done(id, "Product rejected with seller feedback."); }
