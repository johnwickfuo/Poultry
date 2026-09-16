import { z } from "zod";

import { nairaToKobo } from "./product";

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "Federal Capital Territory", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun",
  "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe",
  "Zamfara",
] as const;

export const nigerianStateSchema = z.enum(NIGERIAN_STATES, {
  error: "Select a valid Nigerian state.",
});

export const deliveryMethodSchema = z.enum([
  "SELLER_ARRANGED",
  "BUYER_PICKUP",
  "QUOTE_REQUIRED",
]);

export const sellerDeliveryRateSchema = z.object({
  state: nigerianStateSchema,
  feeKobo: z.string().trim().transform((value, context) => {
    const kobo = nairaToKobo(value);
    if (kobo === undefined || kobo < 0 || kobo > 99_999_999_999) {
      context.addIssue({ code: "custom", message: "Enter a valid delivery fee." });
      return z.NEVER;
    }
    return BigInt(kobo);
  }),
});

export const pickupSettingsSchema = z.object({
  buyerPickupEnabled: z.preprocess((value) => value === "on", z.boolean()),
  pickupState: z.union([nigerianStateSchema, z.literal("")]),
  pickupLga: z.string().trim().max(100),
  pickupAddress: z.string().trim().max(300),
  pickupInstructions: z.string().trim().max(1500),
}).superRefine((value, context) => {
  if (!value.buyerPickupEnabled) return;
  if (!value.pickupState) context.addIssue({ code: "custom", path: ["pickupState"], message: "Select the pickup state." });
  if (value.pickupLga.length < 2) context.addIssue({ code: "custom", path: ["pickupLga"], message: "Enter the pickup LGA or area." });
  if (value.pickupAddress.length < 5) context.addIssue({ code: "custom", path: ["pickupAddress"], message: "Enter the full pickup address." });
});

export type CheckoutDeliveryInput = {
  buyerState: (typeof NIGERIAN_STATES)[number];
  selections: Record<string, z.infer<typeof deliveryMethodSchema>>;
};
