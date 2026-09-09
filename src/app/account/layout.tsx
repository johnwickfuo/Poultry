import { DashboardShell, type ShellNavItem } from "@/components";
import { requireUser } from "@/server/authorization";
import { BrandingService } from "@/server/branding";

export default async function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const roles = user.roles.map(({ role }) => role.name);
  const branding = await BrandingService.getIdentity();
  const navigation: ShellNavItem[] = [
    { href: "/account", label: "Account overview" },
    { href: "/account/orders", label: "My orders" },
    ...(roles.includes("seller") ? [{ href: "/seller", label: "Seller workspace" }] : []),
    ...(roles.includes("mentor") ? [{ href: "/mentor", label: "Mentor workspace" }] : []),
    ...(roles.includes("admin") ? [{ href: "/admin", label: "Administration" }] : []),
  ];

  return (
    <DashboardShell
      companyName={branding.companyName}
      eyebrow="Your account"
      logo={branding.logoDark || branding.logo}
      navigation={navigation}
      shortName={branding.companyShortName}
      userName={user.profile?.displayName || user.username}
    >
      {children}
    </DashboardShell>
  );
}
