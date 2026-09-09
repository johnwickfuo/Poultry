import { DashboardShell } from "@/components";
import { requireRole, ROLE_NAMES } from "@/server/authorization";
import { BrandingService } from "@/server/branding";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, branding] = await Promise.all([
    requireRole(ROLE_NAMES.ADMIN),
    BrandingService.getIdentity(),
  ]);

  return (
    <DashboardShell
      companyName={branding.companyName}
      eyebrow="Administration"
      logo={branding.logoDark || branding.logo}
      navigation={[
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/sellers", label: "Seller applications" },
        { href: "/admin/categories", label: "Categories" },
        { href: "/admin/settings", label: "Platform settings" },
        { href: "/admin/mail", label: "Mail previews" },
        { href: "/account", label: "My account" },
      ]}
      shortName={branding.companyShortName}
      userName={user.profile?.displayName || user.username}
    >
      {children}
    </DashboardShell>
  );
}
