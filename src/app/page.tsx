import { HomeContent } from "@/components/home-content";
import { BrandingService } from "@/server/branding";
import { getPublicCategories } from "@/server/categories";

export default async function Home() {
  const [branding, categories] = await Promise.all([BrandingService.getIdentity(), getPublicCategories()]);
  return (
    <HomeContent
      address={branding.address}
      categories={categories.slice(0, 4).map((category) => ({ name: category.name, description: category.description || `Browse ${category.name}`, image: category.imagePath || "/images/poultry/live-birds.webp", href: `/categories/${category.slug}` }))}
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
