import "server-only";

import { randomUUID } from "node:crypto";

import type { MediaSettingKey } from "@/server/settings/registry";
import { localStorage } from "./local";

type DetectedMedia = { extension: string; contentType: string };

function detectMedia(bytes: Uint8Array): DetectedMedia | null {
  const hex = Buffer.from(bytes.subarray(0, 12)).toString("hex");
  if (hex.startsWith("89504e470d0a1a0a")) {
    return { extension: "png", contentType: "image/png" };
  }
  if (hex.startsWith("ffd8ff")) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }
  if (hex.startsWith("52494646") && hex.slice(16, 24) === "57454250") {
    return { extension: "webp", contentType: "image/webp" };
  }
  if (hex.startsWith("00000100")) {
    return { extension: "ico", contentType: "image/x-icon" };
  }
  if (hex.slice(8, 16) === "66747970") {
    return { extension: "mp4", contentType: "video/mp4" };
  }
  return null;
}

const allowedTypes: Record<MediaSettingKey, readonly string[]> = {
  company_logo: ["image/png", "image/jpeg", "image/webp"],
  company_logo_dark: ["image/png", "image/jpeg", "image/webp"],
  company_favicon: ["image/png", "image/x-icon"],
  homepage_hero_media: ["image/png", "image/jpeg", "image/webp", "video/mp4"],
};

export async function storeSettingMedia(file: File, key: MediaSettingKey) {
  const maxBytes = key === "homepage_hero_media" ? 20_000_000 : 5_000_000;
  if (file.size <= 0 || file.size > maxBytes) {
    throw new Error(`File must be smaller than ${maxBytes / 1_000_000} MB.`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectMedia(bytes);
  if (!detected || !allowedTypes[key].includes(detected.contentType)) {
    throw new Error("Unsupported file type.");
  }

  const storageKey = `settings/${key}/${randomUUID()}.${detected.extension}`;
  return localStorage.put(storageKey, bytes);
}
