import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { POULTRY_TAXONOMY } from "@/server/categories/taxonomy";
import { categorySchema } from "@/server/validation/category";

const requiredChildren: Record<string, string[]> = {
  "Live Birds": ["Broiler Chickens", "Layer Chickens", "Cockerels", "Turkeys", "Ducks", "Guinea Fowl", "Quail", "Geese", "Breeder Stock"],
  "Day-Old Chicks & Poults": ["Broiler Chicks", "Layer Chicks", "Cockerel Chicks", "Turkey Poults", "Ducklings", "Guinea Fowl Keets", "Quail Chicks"],
  Eggs: ["Table Eggs", "Hatching Eggs", "Quail Eggs", "Turkey Eggs", "Duck Eggs"],
  "Poultry Feed": ["Chick Starter", "Grower Feed", "Finisher Feed", "Layer Mash", "Breeder Feed", "Turkey Feed", "Duck Feed", "Quail Feed", "Feed Ingredients", "Feed Supplements"],
  "Poultry Equipment": ["Feeders", "Drinkers", "Brooders", "Incubators", "Hatchers", "Egg Trays & Crates", "Cages", "Nesting Equipment", "Heating Equipment", "Ventilation Equipment", "Lighting Equipment", "Scales", "Cleaning Equipment"],
  "Veterinary & Health": ["Vaccines", "Antibiotics", "Vitamins & Supplements", "Dewormers", "Disinfectants", "Coccidiosis Products", "Biosecurity Products", "Diagnostic Products"],
  "Hatchery Supplies": ["Incubation Accessories", "Candling Equipment", "Chick Boxes", "Hatchery Hygiene Products"],
  "Poultry Housing & Farm Infrastructure": ["Poultry Houses", "Pens", "Flooring & Litter", "Curtains", "Fencing", "Water Systems", "Feed Storage"],
  "Processing & Packaging": ["Pluckers", "Scalders", "Slaughter Equipment", "Processing Tables", "Freezers & Cold Storage", "Packaging Materials", "Egg Packaging"],
  "Farm Inputs & Consumables": ["Wood Shavings", "Sawdust", "Litter Treatments", "Cleaning Supplies", "Farm Clothing & PPE"],
};

describe("poultry marketplace taxonomy", () => {
  it("contains every required top-level category and subcategory", () => {
    expect(POULTRY_TAXONOMY.map((category) => category.name)).toEqual(Object.keys(requiredChildren));
    for (const category of POULTRY_TAXONOMY) expect(category.children.map((item) => item.name)).toEqual(requiredChildren[category.name]);
  });

  it("uses unique SEO-safe slugs across the complete hierarchy", () => {
    const slugs = POULTRY_TAXONOMY.flatMap((category) => [category.slug, ...category.children.map((item) => item.slug)]);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))).toBe(true);
  });

  it("ships a valid local WebP image for every top-level category", async () => {
    for (const category of POULTRY_TAXONOMY) {
      const filePath = path.join(process.cwd(), "public", category.imagePath);
      expect((await stat(filePath)).size).toBeGreaterThan(10_000);
      const header = await readFile(filePath);
      expect(header.subarray(0, 4).toString()).toBe("RIFF");
      expect(header.subarray(8, 12).toString()).toBe("WEBP");
    }
  });

  it("rejects non-SEO admin slugs", () => {
    expect(categorySchema.safeParse({ name: "Bird Supplies", slug: "Bird Supplies!", description: "", icon: "", parentId: "", sortOrder: 0, isActive: true }).success).toBe(false);
  });
});
