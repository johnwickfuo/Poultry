import { DashboardShell } from "@/components";
import { requireRole, ROLE_NAMES } from "@/server/authorization";
import { BrandingService } from "@/server/branding";

export default async function SellerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, branding] = await Promise.all([
    requireRole(ROLE_NAMES.SELLER),
    BrandingService.getIdentity(),
  ]);

  return (
    <DashboardShell
      companyName={branding.companyName}
      eyebrow="Seller workspace"
      logo={branding.logoDark || branding.logo}
      navigation={[
        { href: "/seller", label: "Overview" },
        { href: "/seller/products", label: "Products" },
        { href: "/seller/orders", label: "Orders" },
        { href: "/account", label: "My account" },
      ]}
      shortName={branding.companyShortName}
      userName={user.profile?.displayName || user.username}
    >
      {children}
    </DashboardShell>
  );
}
