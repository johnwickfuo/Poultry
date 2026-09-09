import { prisma } from "@/server/database/prisma";
import { POULTRY_TAXONOMY } from "./taxonomy";

export async function getPublicCategories() {
  try {
    return await prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: { children: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  } catch {
    return POULTRY_TAXONOMY.map((category, parentIndex) => ({
      id: `seed-${category.slug}`, parentId: null, ...category, sortOrder: parentIndex, isActive: true,
      createdAt: new Date(0), updatedAt: new Date(0),
      children: category.children.map((subcategory, childIndex) => ({ id: `seed-${subcategory.slug}`, parentId: `seed-${category.slug}`, ...subcategory, imagePath: null, icon: null, sortOrder: childIndex, isActive: true, createdAt: new Date(0), updatedAt: new Date(0) })),
    }));
  }
}

export async function getPublicCategoryBySlug(slug: string) {
  try {
    return await prisma.category.findFirst({
      where: { slug, isActive: true, OR: [{ parent: null }, { parent: { isActive: true } }] },
      include: {
        parent: { select: { name: true, slug: true, imagePath: true } },
        children: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
      },
    });
  } catch {
    for (const [parentIndex, category] of POULTRY_TAXONOMY.entries()) {
      if (category.slug === slug) return { id: `seed-${slug}`, parentId: null, ...category, sortOrder: parentIndex, isActive: true, createdAt: new Date(0), updatedAt: new Date(0), parent: null, children: category.children.map((item, index) => ({ id: `seed-${item.slug}`, parentId: `seed-${slug}`, ...item, imagePath: null, icon: null, sortOrder: index, isActive: true, createdAt: new Date(0), updatedAt: new Date(0) })) };
      const childIndex = category.children.findIndex((item) => item.slug === slug);
      if (childIndex >= 0) {
        const item = category.children[childIndex];
        return { id: `seed-${slug}`, parentId: `seed-${category.slug}`, ...item, imagePath: null, icon: null, sortOrder: childIndex, isActive: true, createdAt: new Date(0), updatedAt: new Date(0), parent: { name: category.name, slug: category.slug, imagePath: category.imagePath }, children: [] };
      }
    }
    return null;
  }
}

export function getAdminCategoryTree() {
  return prisma.category.findMany({
    where: { parentId: null },
    include: { children: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export function getAdminCategory(id: string) {
  return prisma.category.findUnique({ where: { id }, include: { parent: true, children: { orderBy: { sortOrder: "asc" } } } });
}

export function getTopLevelCategoryOptions() {
  return prisma.category.findMany({ where: { parentId: null }, select: { id: true, name: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}
