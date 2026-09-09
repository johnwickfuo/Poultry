import { SiteFooter, SiteHeader } from "@/components";
import { BrandingService } from "@/server/branding";

export default async function CategoriesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const branding = await BrandingService.getIdentity();
  return <div className="min-h-screen bg-eggshell"><SiteHeader companyName={branding.companyName} logo={branding.logo} shortName={branding.companyShortName}/><main>{children}</main><SiteFooter branding={branding}/></div>;
}
