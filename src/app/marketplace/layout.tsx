import { SiteFooter, SiteHeader } from "@/components";
import { BrandingService } from "@/server/branding";
import { getRequestCartCount } from "@/server/cart";

export default async function MarketplaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [branding, cartCount] = await Promise.all([BrandingService.getIdentity(), getRequestCartCount()]);
  return <div className="min-h-screen bg-eggshell"><SiteHeader cartCount={cartCount} companyName={branding.companyName} logo={branding.logo} shortName={branding.companyShortName}/><main>{children}</main><SiteFooter branding={branding}/></div>;
}
