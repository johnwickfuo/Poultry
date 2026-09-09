import { z } from "zod";

export type SettingDefinition<T> = {
  defaultValue: T;
  parse: (raw: string) => T;
  serialize: (value: unknown) => string;
};

function stringSetting(defaultValue = ""): SettingDefinition<string> {
  return {
    defaultValue,
    parse: (raw) => raw,
    serialize: (value) => z.string().trim().parse(value),
  };
}

function numberSetting(
  defaultValue: number,
  options: { min: number; max: number },
): SettingDefinition<number> {
  const schema = z.coerce.number().min(options.min).max(options.max);
  return {
    defaultValue,
    parse: (raw) => schema.parse(raw),
    serialize: (value) => String(schema.parse(value)),
  };
}

function enumSetting<const T extends readonly [string, ...string[]]>(
  values: T,
  defaultValue: T[number],
): SettingDefinition<T[number]> {
  const schema = z.enum(values);
  return {
    defaultValue,
    parse: (raw) => schema.parse(raw),
    serialize: (value) => schema.parse(value),
  };
}

export const socialLinksSchema = z.record(
  z.string().min(1),
  z.url().refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "Social links must use http or https."),
);

function socialLinksSetting(): SettingDefinition<Record<string, string>> {
  return {
    defaultValue: {},
    parse: (raw) => socialLinksSchema.parse(JSON.parse(raw)),
    serialize: (value) => JSON.stringify(socialLinksSchema.parse(value)),
  };
}

export const SETTING_DEFINITIONS = {
  marketplace_commission_percent: numberSetting(0, { min: 0, max: 100 }),
  consultation_standard_response_hours: numberSetting(48, { min: 1, max: 720 }),
  consultation_urgent_response_hours: numberSetting(6, { min: 1, max: 168 }),
  buyer_request_expiry_days: numberSetting(14, { min: 1, max: 365 }),
  quote_validity_days: numberSetting(30, { min: 1, max: 365 }),
  settlement_driver: enumSetting(["escrow"] as const, "escrow"),
  active_payment_gateway: enumSetting(
    ["paystack", "flutterwave"] as const,
    "paystack",
  ),
  payout_mode: enumSetting(
    ["manual_request", "automatic"] as const,
    "manual_request",
  ),
  dispute_window_days: numberSetting(7, { min: 1, max: 90 }),
  consultation_followup_days: numberSetting(30, { min: 1, max: 365 }),
  company_name: stringSetting(),
  company_short_name: stringSetting(),
  company_tagline: stringSetting(),
  company_email: stringSetting(),
  company_phone: stringSetting(),
  company_whatsapp: stringSetting(),
  company_address: stringSetting(),
  company_rc_number: stringSetting(),
  company_logo: stringSetting(),
  company_logo_dark: stringSetting(),
  company_favicon: stringSetting(),
  company_social_links: socialLinksSetting(),
  homepage_hero_media: stringSetting(),
} satisfies Record<string, SettingDefinition<unknown>>;

export type SettingKey = keyof typeof SETTING_DEFINITIONS;
export type SettingValue<K extends SettingKey> =
  (typeof SETTING_DEFINITIONS)[K] extends SettingDefinition<infer T> ? T : never;

export function serializeSetting<K extends SettingKey>(
  key: K,
  value: SettingValue<K>,
): string {
  return SETTING_DEFINITIONS[key].serialize(value);
}

export const SETTING_SEED_VALUES: { [K in SettingKey]: SettingValue<K> } = {
  marketplace_commission_percent: 0,
  consultation_standard_response_hours: 48,
  consultation_urgent_response_hours: 6,
  buyer_request_expiry_days: 14,
  quote_validity_days: 30,
  settlement_driver: "escrow",
  active_payment_gateway: "paystack",
  payout_mode: "manual_request",
  dispute_window_days: 7,
  consultation_followup_days: 30,
  company_name: "",
  company_short_name: "",
  company_tagline: "",
  company_email: "",
  company_phone: "",
  company_whatsapp: "",
  company_address: "",
  company_rc_number: "",
  company_logo: "",
  company_logo_dark: "",
  company_favicon: "",
  company_social_links: {},
  homepage_hero_media: "",
};

export const PLATFORM_SETTING_KEYS = [
  "marketplace_commission_percent",
  "consultation_standard_response_hours",
  "consultation_urgent_response_hours",
  "buyer_request_expiry_days",
  "quote_validity_days",
  "settlement_driver",
  "payout_mode",
  "dispute_window_days",
  "consultation_followup_days",
] as const satisfies readonly SettingKey[];

export const BRANDING_SETTING_KEYS = [
  "company_name",
  "company_short_name",
  "company_tagline",
  "company_email",
  "company_phone",
  "company_whatsapp",
  "company_address",
  "company_rc_number",
  "company_logo",
  "company_logo_dark",
  "company_favicon",
  "company_social_links",
] as const satisfies readonly SettingKey[];

export const MEDIA_SETTING_KEYS = [
  "company_logo",
  "company_logo_dark",
  "company_favicon",
  "homepage_hero_media",
] as const satisfies readonly SettingKey[];

export type MediaSettingKey = (typeof MEDIA_SETTING_KEYS)[number];
