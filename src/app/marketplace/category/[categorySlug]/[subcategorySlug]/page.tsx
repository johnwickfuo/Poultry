import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketplaceCategoryPageContent } from "@/components";
import { getPublicCategoryBySlug } from "@/server/categories";
import type { PublicSearchParams } from "@/server/validation/marketplace";

type Props = { params: Promise<{ categorySlug: string; subcategorySlug: string }>; searchParams: Promise<PublicSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug, subcategorySlug } = await params;
  const category = await getPublicCategoryBySlug(subcategorySlug);
  if (!category?.parent || category.parent.slug !== categorySlug) return { title: "Category not found" };
  return { title: `${category.name} for sale`, description: category.description || `Shop approved ${category.name.toLowerCase()} listings from poultry sellers.` };
}

export default async function MarketplaceSubcategoryPage({ params, searchParams }: Props) {
  const { categorySlug, subcategorySlug } = await params;
  const category = await getPublicCategoryBySlug(subcategorySlug);
  if (!category?.parent || category.parent.slug !== categorySlug) notFound();
  return <MarketplaceCategoryPageContent category={category} categorySlug={categorySlug} raw={await searchParams} subcategorySlug={subcategorySlug}/>;
}
