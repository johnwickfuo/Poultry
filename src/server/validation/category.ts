import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Enter a category name.").max(100),
  slug: z.string().trim().toLowerCase().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  description: z.string().trim().max(1000).optional().default(""),
  icon: z.string().trim().max(60).optional().default(""),
  parentId: z.string().trim().optional().transform((value) => value || null),
  sortOrder: z.coerce.number().int().min(0).max(10_000),
  isActive: z.preprocess((value) => value === "on" || value === "true" || value === true, z.boolean()),
});
