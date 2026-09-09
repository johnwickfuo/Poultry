import { DashboardShell } from "@/components";
import { requireRole, ROLE_NAMES } from "@/server/authorization";
import { BrandingService } from "@/server/branding";

export default async function MentorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, branding] = await Promise.all([
    requireRole(ROLE_NAMES.MENTOR),
    BrandingService.getIdentity(),
  ]);

  return (
    <DashboardShell
      companyName={branding.companyName}
      eyebrow="Mentor workspace"
      logo={branding.logoDark || branding.logo}
      navigation={[
        { href: "/mentor", label: "Overview" },
        { href: "/mentor/consultations", label: "Consultations" },
        { href: "/mentor/availability", label: "Availability" },
        { href: "/account", label: "My account" },
      ]}
      shortName={branding.companyShortName}
      userName={user.profile?.displayName || user.username}
    >
      {children}
    </DashboardShell>
  );
}
