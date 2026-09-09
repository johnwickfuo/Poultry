import "server-only";

import { getSettings } from "@/server/settings";
import {
  BRANDING_SETTING_KEYS,
  SETTING_SEED_VALUES,
  type SettingValue,
} from "@/server/settings/registry";
import { applyBrandPlaceholders } from "./placeholders";

type EditableBrandingSettings = {
  [K in (typeof BRANDING_SETTING_KEYS)[number]]: SettingValue<K>;
};

export type BrandingIdentity = {
  companyName: string;
  companyShortName: string;
  tagline: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  rcNumber: string;
  logo: string;
  logoDark: string;
  favicon: string;
  socialLinks: Record<string, string>;
};

export class BrandingService {
  static async getEditableSettings(): Promise<EditableBrandingSettings> {
    try {
      return await getSettings(BRANDING_SETTING_KEYS);
    } catch {
      return Object.fromEntries(
        BRANDING_SETTING_KEYS.map((key) => [key, SETTING_SEED_VALUES[key]]),
      ) as EditableBrandingSettings;
    }
  }

  static async getIdentity(): Promise<BrandingIdentity> {
    const settings = await this.getEditableSettings();
    const appName = process.env.APP_NAME?.trim() || "Poultry Platform";
    const companyName = settings.company_name.trim() || appName;

    return {
      companyName,
      companyShortName: settings.company_short_name.trim() || companyName,
      tagline: settings.company_tagline,
      email: settings.company_email,
      phone: settings.company_phone,
      whatsapp: settings.company_whatsapp,
      address: settings.company_address,
      rcNumber: settings.company_rc_number,
      logo: settings.company_logo,
      logoDark: settings.company_logo_dark,
      favicon: settings.company_favicon,
      socialLinks: settings.company_social_links,
    };
  }

  static async replaceBrandPlaceholders(content: string): Promise<string> {
    const branding = await this.getIdentity();
    return applyBrandPlaceholders(content, branding);
  }
}

export async function replaceBrandPlaceholders(content: string) {
  return BrandingService.replaceBrandPlaceholders(content);
}
