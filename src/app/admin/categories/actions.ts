"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole, ROLE_NAMES } from "@/server/authorization";
import { prisma } from "@/server/database/prisma";
import { localStorage, storeCategoryImage } from "@/server/storage";
import { categorySchema } from "@/server/validation/category";
import type { CategoryFormState } from "./form-state";

async function requireAdmin() { await requireRole(ROLE_NAMES.ADMIN); }

function validationError(error: import("zod").ZodError): CategoryFormState {
  return { status: "error", message: "Correct the highlighted fields.", fieldErrors: error.flatten().fieldErrors };
}

function databaseError(error: unknown): CategoryFormState {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "That slug is already in use." };
  if (error instanceof Error && (error.message.startsWith("Upload a ") || error.message.startsWith("Category image "))) return { status: "error", message: error.message };
  return { status: "error", message: "Unable to save the category." };
}

function refreshCategories() {
  revalidatePath("/");
  revalidatePath("/categories", "layout");
  revalidatePath("/admin/categories");
}

async function validParent(parentId: string | null, categoryId?: string) {
  if (!parentId) return true;
  if (parentId === categoryId) return false;
  const parent = await prisma.category.findFirst({ where: { id: parentId, parentId: null }, select: { id: true } });
  return Boolean(parent);
}

export async function createCategoryAction(_previous: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return validationError(parsed.error);
  if (!await validParent(parsed.data.parentId)) return { status: "error", message: "Subcategories must belong to a top-level category." };
  let category;
  try { category = await prisma.category.create({ data: parsed.data }); }
  catch (error) { return databaseError(error); }
  refreshCategories();
  redirect(`/admin/categories/${category.id}?created=1`);
}

export async function updateCategoryAction(id: string, _previous: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return validationError(parsed.error);
  const category = await prisma.category.findUnique({ where: { id }, select: { children: { select: { id: true }, take: 1 } } });
  if (!category) return { status: "error", message: "Category not found." };
  if (category.children.length && parsed.data.parentId) return { status: "error", message: "A category with subcategories must remain top level." };
  if (!await validParent(parsed.data.parentId, id)) return { status: "error", message: "Choose a valid top-level parent." };
  try {
    await prisma.category.update({ where: { id }, data: parsed.data });
    refreshCategories();
    return { status: "success", message: "Category updated." };
  } catch (error) { return databaseError(error); }
}

export async function toggleCategoryAction(id: string) {
  await requireAdmin();
  const category = await prisma.category.findUnique({ where: { id }, select: { isActive: true } });
  if (!category) return;
  await prisma.category.update({ where: { id }, data: { isActive: !category.isActive } });
  refreshCategories();
}

export async function moveCategoryAction(id: string, direction: "up" | "down") {
  await requireAdmin();
  await prisma.$transaction(async (transaction) => {
    const category = await transaction.category.findUnique({ where: { id } });
    if (!category) return;
    const siblings = await transaction.category.findMany({ where: { parentId: category.parentId }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, sortOrder: true } });
    const index = siblings.findIndex((item) => item.id === id);
    const otherIndex = index + (direction === "up" ? -1 : 1);
    const other = siblings[otherIndex];
    if (!other) return;
    [siblings[index], siblings[otherIndex]] = [siblings[otherIndex], siblings[index]];
    for (const [sortOrder, sibling] of siblings.entries()) {
      await transaction.category.update({ where: { id: sibling.id }, data: { sortOrder } });
    }
  });
  refreshCategories();
}

export async function uploadCategoryImageAction(id: string, _previous: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  await requireAdmin();
  const file = formData.get("image");
  if (!(file instanceof File) || !file.size) return { status: "error", message: "Choose an image to upload." };
  const current = await prisma.category.findUnique({ where: { id }, select: { imagePath: true } });
  if (!current) return { status: "error", message: "Category not found." };
  let imagePath = "";
  try {
    imagePath = await storeCategoryImage(file, id);
    await prisma.category.update({ where: { id }, data: { imagePath } });
  } catch (error) {
    if (imagePath) await localStorage.delete(imagePath).catch(() => undefined);
    return databaseError(error);
  }
  if (current.imagePath) await localStorage.delete(current.imagePath).catch(() => undefined);
  refreshCategories();
  return { status: "success", message: "Category image replaced." };
}
