import { HomeContent } from "@/components/home-content";
import { BrandingService } from "@/server/branding";

export default async function Home() {
  const branding = await BrandingService.getIdentity();
  return (
    <HomeContent
      companyName={branding.companyName}
      tagline={branding.tagline}
    />
  );
}
