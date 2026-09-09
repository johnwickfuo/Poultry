import { HomeContent } from "@/components/home-content";
import { BrandingService } from "@/server/branding";

export default async function Home() {
  const branding = await BrandingService.getIdentity();
  return (
    <HomeContent
      address={branding.address}
      companyName={branding.companyName}
      companyShortName={branding.companyShortName}
      email={branding.email}
      logo={branding.logo}
      logoDark={branding.logoDark}
      phone={branding.phone}
      rcNumber={branding.rcNumber}
      socialLinks={branding.socialLinks}
      tagline={branding.tagline}
      whatsapp={branding.whatsapp}
    />
  );
}
