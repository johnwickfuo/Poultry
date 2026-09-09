import "server-only";

import { renderToStaticMarkup } from "react-dom/server.edge";

import { BrandingService } from "@/server/branding";
import { parseServerEnv } from "@/server/validation/env";
import { buildEmailTemplate, type EmailTemplateData, type EmailTemplateKey } from "./templates";

export async function renderEmailTemplate(key: EmailTemplateKey, data: EmailTemplateData) {
  const [identity, env] = await Promise.all([
    BrandingService.getIdentity(),
    Promise.resolve(parseServerEnv()),
  ]);
  const logoPath = identity.logoDark || identity.logo;
  const branding = {
    companyName: identity.companyName,
    companyShortName: identity.companyShortName,
    tagline: identity.tagline,
    email: identity.email,
    phone: identity.phone,
    address: identity.address,
    logoUrl: logoPath ? new URL(logoPath, env.APP_URL).toString() : "",
  };
  const template = buildEmailTemplate(key, data, branding);

  return {
    ...template,
    html: `<!doctype html>${renderToStaticMarkup(template.element)}`,
  };
}
