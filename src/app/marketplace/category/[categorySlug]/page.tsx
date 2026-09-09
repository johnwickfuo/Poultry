import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketplaceCategoryPageContent } from "@/components";
import { getPublicCategoryBySlug } from "@/server/categories";
import type { PublicSearchParams } from "@/server/validation/marketplace";

type Props = { params: Promise<{ categorySlug: string }>; searchParams: Promise<PublicSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getPublicCategoryBySlug((await params).categorySlug);
  if (!category || category.parent) return { title: "Category not found" };
  return { title: `${category.name} poultry products`, description: category.description || `Shop approved ${category.name.toLowerCase()} products and suppliers.` };
}

export default async function MarketplaceCategoryPage({ params, searchParams }: Props) {
  const { categorySlug } = await params;
  const category = await getPublicCategoryBySlug(categorySlug);
  if (!category || category.parent) notFound();
  return <MarketplaceCategoryPageContent category={category} categorySlug={categorySlug} raw={await searchParams}/>;
}
