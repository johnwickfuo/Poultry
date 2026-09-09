"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireApprovedSeller } from "@/server/authorization";
import { prisma } from "@/server/database/prisma";
import { addBulkTier, addVariant, createProduct, deleteBulkTier, deleteVariant, markMaterialEdit, ProductAccessError, requireOwnedProduct, setProductPublished, submitProduct, updateProduct, updateProductStock, updateVariantAvailability } from "@/server/services/product-catalogue";
import { localStorage, storeProductImage } from "@/server/storage";
import { bulkTierSchema, productFormSchema, stockSchema, variantSchema } from "@/server/validation/product";
import type { ProductFormState } from "./form-state";

function fields(error: import("zod").ZodError): ProductFormState { return { status: "error", message: "Correct the highlighted fields.", fieldErrors: error.flatten().fieldErrors }; }
function failure(error: unknown): ProductFormState {
  if (error instanceof ProductAccessError) return { status: "error", message: error.message };
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "That slug or SKU is already in use." };
  return { status: "error", message: "Unable to save this product." };
}
function refresh(id?: string) { revalidatePath("/seller/products"); if (id) revalidatePath(`/seller/products/${id}`, "layout"); revalidatePath("/admin/products"); }

export async function createProductAction(_state: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const user = await requireApprovedSeller(); const parsed = productFormSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return fields(parsed.error);
  let product;
  try { product = await createProduct(user.id, parsed.data); } catch (error) { return failure(error); }
  refresh(); redirect(`/seller/products/${product.id}/edit?created=1`);
}
export async function updateProductAction(id: string, _state: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const user = await requireApprovedSeller(); const parsed = productFormSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return fields(parsed.error);
  try { await updateProduct(id, user.id, parsed.data); refresh(id); return { status: "success", message: "Product updated." }; } catch (error) { return failure(error); }
}
export async function submitProductAction(id: string) { const user = await requireApprovedSeller(); await submitProduct(id, user.id); refresh(id); }
export async function publishProductAction(id: string, published: boolean) { const user = await requireApprovedSeller(); await setProductPublished(id, user.id, published); refresh(id); }
export async function updateStockAction(id: string, _state: ProductFormState, formData: FormData): Promise<ProductFormState> { const user = await requireApprovedSeller(); const parsed = stockSchema.safeParse(Object.fromEntries(formData.entries())); if (!parsed.success) return fields(parsed.error); try { await updateProductStock(id, user.id, parsed.data.stockQuantity); refresh(id); return { status: "success", message: "Stock updated." }; } catch (error) { return failure(error); } }
export async function addVariantAction(id: string, _state: ProductFormState, formData: FormData): Promise<ProductFormState> { const user = await requireApprovedSeller(); const parsed = variantSchema.safeParse(Object.fromEntries(formData.entries())); if (!parsed.success) return fields(parsed.error); try { await addVariant(id, user.id, parsed.data); refresh(id); return { status: "success", message: "Variant added." }; } catch (error) { return failure(error); } }
export async function deleteVariantAction(id: string, productId: string) { const user = await requireApprovedSeller(); await deleteVariant(id, productId, user.id); refresh(productId); }
export async function updateVariantAvailabilityAction(id: string, productId: string, formData: FormData) { const user = await requireApprovedSeller(); const parsed = stockSchema.parse({ stockQuantity: formData.get("stockQuantity") }); await updateVariantAvailability(id, productId, user.id, parsed.stockQuantity, formData.get("isActive") === "on"); refresh(productId); }
export async function addBulkTierAction(id: string, _state: ProductFormState, formData: FormData): Promise<ProductFormState> { const user = await requireApprovedSeller(); const parsed = bulkTierSchema.safeParse(Object.fromEntries(formData.entries())); if (!parsed.success) return fields(parsed.error); try { await addBulkTier(id, user.id, parsed.data); refresh(id); return { status: "success", message: "Bulk price tier added." }; } catch (error) { return failure(error); } }
export async function deleteBulkTierAction(id: string, productId: string) { const user = await requireApprovedSeller(); await deleteBulkTier(id, productId, user.id); refresh(productId); }

export async function uploadProductImageAction(productId: string, _state: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const user = await requireApprovedSeller(); const product = await requireOwnedProduct(productId, user.id); const file = formData.get("image");
  if (!(file instanceof File) || !file.size) return { status: "error", message: "Choose an image." };
  if (product.images.length >= 10) return { status: "error", message: "A product can have up to 10 images." };
  let path = "";
  try { path = await storeProductImage(file, productId); await prisma.productImage.create({ data: { productId, path, altText: String(formData.get("altText") || "").trim() || null, sortOrder: product.images.length, isPrimary: product.images.length === 0 } }); await markMaterialEdit(productId, user.id); }
  catch (error) {
    if (path) await localStorage.delete(path).catch(() => undefined);
    const safeMessage = error instanceof Error && /^(Product image|Upload a)/.test(error.message) ? error.message : "Unable to upload image.";
    return { status: "error", message: safeMessage };
  }
  refresh(productId); return { status: "success", message: "Image uploaded and optimized." };
}
export async function moveProductImageAction(imageId: string, productId: string, direction: "up" | "down") { const user = await requireApprovedSeller(); const product = await requireOwnedProduct(productId, user.id); const index = product.images.findIndex((image) => image.id === imageId); const target = index + (direction === "up" ? -1 : 1); if (index < 0 || !product.images[target]) return; [product.images[index], product.images[target]] = [product.images[target], product.images[index]]; await prisma.$transaction(product.images.map((image, sortOrder) => prisma.productImage.update({ where: { id: image.id }, data: { sortOrder } }))); await markMaterialEdit(productId, user.id); refresh(productId); }
export async function setPrimaryImageAction(imageId: string, productId: string) { const user = await requireApprovedSeller(); await requireOwnedProduct(productId, user.id); await prisma.$transaction([prisma.productImage.updateMany({ where: { productId }, data: { isPrimary: false } }), prisma.productImage.update({ where: { id: imageId, productId }, data: { isPrimary: true } })]); await markMaterialEdit(productId, user.id); refresh(productId); }
export async function deleteProductImageAction(imageId: string, productId: string) { const user = await requireApprovedSeller(); await requireOwnedProduct(productId, user.id); const image = await prisma.productImage.findFirst({ where: { id: imageId, productId } }); if (!image) return; await prisma.productImage.delete({ where: { id: imageId } }); await localStorage.delete(image.path).catch(() => undefined); const first = await prisma.productImage.findFirst({ where: { productId }, orderBy: { sortOrder: "asc" } }); if (image.isPrimary && first) await prisma.productImage.update({ where: { id: first.id }, data: { isPrimary: true } }); await markMaterialEdit(productId, user.id); refresh(productId); }
