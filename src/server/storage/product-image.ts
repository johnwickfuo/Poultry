import "server-only";

import { randomUUID } from "node:crypto";
import sharp from "sharp";

import { localStorage } from "./local";

export async function storeProductImage(file: File, productId: string) {
  if (file.size <= 0 || file.size > 8_000_000) throw new Error("Product image must be smaller than 8 MB.");
  const input = Buffer.from(await file.arrayBuffer());
  const metadata = await sharp(input, { failOn: "warning" }).metadata().catch(() => null);
  if (!metadata || !["jpeg", "png", "webp"].includes(metadata.format || "")) throw new Error("Upload a valid PNG, JPEG or WebP image.");
  const optimized = await sharp(input).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  return localStorage.put(`products/${productId}/${randomUUID()}.webp`, optimized);
}
