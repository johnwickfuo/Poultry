import { z } from "zod";

const optionalText = (maximum: number) => z.string().trim().max(maximum).optional().default("");

export function nairaToKobo(value: unknown): number | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const normalized = String(value).trim().replaceAll(",", "");
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) return undefined;
  const whole = Number(match[1]);
  const fraction = (match[2] || "").padEnd(2, "0");
  const kobo = whole * 100 + Number(fraction || 0);
  return Number.isSafeInteger(kobo) ? kobo : undefined;
}

const priceFromNaira = z.preprocess(nairaToKobo, z.number().int().min(1, "Enter a price greater than zero."));

export const productFormSchema = z.object({
  categoryId: z.string().trim().min(1, "Choose an active poultry category."),
  name: z.string().trim().min(3).max(140),
  slug: z.string().trim().toLowerCase().min(3).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  shortDescription: optionalText(190),
  description: z.string().trim().min(20, "Provide at least 20 characters.").max(5000),
  brand: optionalText(100), species: optionalText(100), condition: optionalText(80), sku: optionalText(100),
  basePriceKobo: priceFromNaira,
  stockQuantity: z.coerce.number().int().min(0, "Stock cannot be negative."),
  minimumOrderQuantity: z.coerce.number().int().min(1),
  unitLabel: z.string().trim().min(1).max(40),
  manufacturer: optionalText(140), activeIngredient: optionalText(180), dosageForm: optionalText(100), packSize: optionalText(100),
  expiryDate: z.string().trim().optional().default("").transform((value) => value ? new Date(`${value}T00:00:00.000Z`) : null).refine((value) => !value || !Number.isNaN(value.getTime()), "Enter a valid expiry date."),
});

export const stockSchema = z.object({ stockQuantity: z.coerce.number().int().min(0, "Stock cannot be negative.") });

export const PRODUCT_OPTION_TYPES = ["size", "weight", "pack_size", "breed", "age", "sex", "presentation"] as const;
export const variantSchema = z.object({
  name: z.string().trim().min(2).max(120), optionType: z.enum(PRODUCT_OPTION_TYPES), optionValue: z.string().trim().min(1).max(120),
  sku: optionalText(100), priceKobo: priceFromNaira, stockQuantity: z.coerce.number().int().min(0),
  isActive: z.preprocess((value) => value === "on" || value === true, z.boolean()),
});

export const bulkTierSchema = z.object({
  minimumQuantity: z.coerce.number().int().min(1),
  maximumQuantity: z.preprocess((value) => value === "" || value == null ? null : value, z.coerce.number().int().min(1).nullable()),
  unitPriceKobo: priceFromNaira,
}).refine((data) => data.maximumQuantity === null || data.maximumQuantity >= data.minimumQuantity, { path: ["maximumQuantity"], message: "Maximum must be at least the minimum." });

export const productRejectionSchema = z.object({ reason: z.string().trim().min(10).max(1000) });
