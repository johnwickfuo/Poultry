import { z } from "zod";

export const SELLER_BUSINESS_TYPES = [
  "individual_farmer",
  "registered_business",
  "hatchery",
  "distributor",
  "cooperative",
] as const;

const requiredText = (label: string, maximum: number) =>
  z.string().trim().min(2, `${label} is required.`).max(maximum);

export const sellerBusinessSchema = z.object({
  businessName: requiredText("Business name", 120),
  businessType: z.enum(SELLER_BUSINESS_TYPES, { error: "Select a business type." }),
  description: requiredText("Business description", 1200),
});

export const sellerContactSchema = z.object({
  phone: requiredText("Phone number", 40),
  whatsapp: z.string().trim().max(40).optional().default(""),
  email: z.email("Enter a valid business email address.").max(320),
});

export const sellerLocationSchema = z.object({
  state: requiredText("State", 80),
  lga: requiredText("LGA", 80),
  address: requiredText("Business address", 300),
});

export const completeSellerApplicationSchema = sellerBusinessSchema
  .extend(sellerContactSchema.shape)
  .extend(sellerLocationSchema.shape);

export const rejectionSchema = z.object({
  reason: z.string().trim().min(10, "Give the seller a clear reason (at least 10 characters).").max(1000),
});

export type CompleteSellerApplication = z.infer<typeof completeSellerApplicationSchema>;
