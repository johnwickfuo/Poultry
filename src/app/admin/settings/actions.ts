"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole, ROLE_NAMES } from "@/server/authorization";
import { getSetting, setSetting, setSettings } from "@/server/settings";
import {
  MEDIA_SETTING_KEYS,
  socialLinksSchema,
  type MediaSettingKey,
} from "@/server/settings/registry";
import { localStorage, storeSettingMedia } from "@/server/storage";
import type { SettingsFormState } from "./form-state";

const optionalEmail = z.union([z.literal(""), z.email("Enter a valid email address.")]);
const brandingSchema = z.object({
  company_name: z.string().trim().max(120),
  company_short_name: z.string().trim().max(60),
  company_tagline: z.string().trim().max(180),
  company_email: optionalEmail,
  company_phone: z.string().trim().max(40),
  company_whatsapp: z.string().trim().max(40),
  company_address: z.string().trim().max(500),
  company_rc_number: z.string().trim().max(80),
  company_social_links: z
    .string()
    .trim()
    .transform((value, context) => {
      try {
        return value ? JSON.parse(value) : {};
      } catch {
        context.addIssue({ code: "custom", message: "Enter valid JSON." });
        return z.NEVER;
      }
    })
    .pipe(socialLinksSchema),
});

const platformRulesSchema = z.object({
  marketplace_commission_percent: z.coerce.number().min(0).max(100),
  consultation_standard_response_hours: z.coerce.number().int().min(1).max(720),
  consultation_urgent_response_hours: z.coerce.number().int().min(1).max(168),
  buyer_request_expiry_days: z.coerce.number().int().min(1).max(365),
  quote_validity_days: z.coerce.number().int().min(1).max(365),
  dispute_window_days: z.coerce.number().int().min(1).max(90),
  consultation_followup_days: z.coerce.number().int().min(1).max(365),
});

const integrationsSchema = z.object({
  settlement_driver: z.literal("escrow"),
  active_payment_gateway: z.enum(["paystack", "flutterwave"]),
  payout_mode: z.enum(["manual_request", "automatic"]),
});

const mediaKeySchema = z.enum(MEDIA_SETTING_KEYS);

function formValues(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function validationError(error: z.ZodError): SettingsFormState {
  return {
    status: "error",
    message: "Please correct the highlighted fields.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

async function requireAdmin() {
  await requireRole(ROLE_NAMES.ADMIN);
}

function saved(message: string): SettingsFormState {
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { status: "success", message };
}

export async function updateBrandingAction(
  _previous: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireAdmin();
  const parsed = brandingSchema.safeParse(formValues(formData));
  if (!parsed.success) return validationError(parsed.error);

  await setSettings(parsed.data);
  return saved("Company and branding settings updated.");
}

export async function updatePlatformRulesAction(
  _previous: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireAdmin();
  const parsed = platformRulesSchema.safeParse(formValues(formData));
  if (!parsed.success) return validationError(parsed.error);

  await setSettings(parsed.data);
  return saved("Platform rules updated.");
}

export async function updateIntegrationsAction(
  _previous: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireAdmin();
  const parsed = integrationsSchema.safeParse(formValues(formData));
  if (!parsed.success) return validationError(parsed.error);

  await setSettings(parsed.data);
  return saved("Integration settings updated.");
}

export async function uploadSettingMediaAction(
  _previous: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireAdmin();
  const keyResult = mediaKeySchema.safeParse(formData.get("key"));
  const file = formData.get("file");
  if (!keyResult.success || !(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose a valid file to upload." };
  }

  const key: MediaSettingKey = keyResult.data;
  const previousPath = await getSetting(key);
  let newPath = "";

  try {
    newPath = await storeSettingMedia(file, key);
    await setSetting(key, newPath);
  } catch (error) {
    if (newPath) await localStorage.delete(newPath);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to upload media.",
    };
  }

  await localStorage.delete(previousPath).catch(() => undefined);
  return saved("Media replaced successfully.");
}

export async function removeSettingMediaAction(formData: FormData) {
  await requireAdmin();
  const parsed = mediaKeySchema.safeParse(formData.get("key"));
  if (!parsed.success) return;

  const previousPath = await getSetting(parsed.data);
  await setSetting(parsed.data, "");
  await localStorage.delete(previousPath).catch(() => undefined);
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}
