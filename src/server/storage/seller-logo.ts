import "server-only";

import { randomUUID } from "node:crypto";

import { localStorage } from "./local";

function imageExtension(bytes: Uint8Array) {
  const hex = Buffer.from(bytes.subarray(0, 12)).toString("hex");
  if (hex.startsWith("89504e470d0a1a0a")) return "png";
  if (hex.startsWith("ffd8ff")) return "jpg";
  if (hex.startsWith("52494646") && hex.slice(16, 24) === "57454250") return "webp";
  return null;
}

export async function storeSellerLogo(file: File, userId: string) {
  if (file.size <= 0 || file.size > 5_000_000) {
    throw new Error("Logo must be smaller than 5 MB.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = imageExtension(bytes);
  if (!extension) throw new Error("Upload a PNG, JPEG or WebP logo.");

  return localStorage.put(`sellers/${userId}/${randomUUID()}.${extension}`, bytes);
}
