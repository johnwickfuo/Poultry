import { z } from "zod";

export const addCartItemSchema = z.object({ productId: z.string().trim().min(1), variantId: z.string().trim().optional().transform((value) => value || null), quantity: z.coerce.number().int().min(1).max(100000) });
export const updateCartItemSchema = z.object({ itemId: z.string().trim().min(1), quantity: z.coerce.number().int().min(1).max(100000) });
export const cartItemIdSchema = z.object({ itemId: z.string().trim().min(1) });
export const priceAcknowledgementSchema = z.object({ acknowledgePriceChanges: z.literal("on", { error: "Confirm that you accept the current prices." }) });
