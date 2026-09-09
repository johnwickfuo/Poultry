import type { BrandingIdentity } from "./index";

export function applyBrandPlaceholders(
  content: string,
  branding: Pick<BrandingIdentity, "companyName" | "companyShortName">,
) {
  return content
    .replaceAll("{company}", branding.companyName)
    .replaceAll("{company_short}", branding.companyShortName);
}
