import type { Metadata } from "next";

import { CategoryCard } from "@/components";
import { getPublicCategories } from "@/server/categories";

export const metadata: Metadata = {
  title: "Poultry marketplace categories",
  description: "Browse live birds, chicks, eggs, feed, equipment, veterinary products and poultry farm supplies.",
};

export default async function CategoriesPage() {
  const categories = await getPublicCategories();
  return <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16"><p className="market-label text-sack">Poultry-only marketplace</p><h1 className="mt-3 max-w-3xl font-display text-4xl font-black tracking-tight text-coop sm:text-5xl">Everything across the poultry value chain</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-coop/65">Browse active categories built around the way poultry farmers, hatcheries, processors and buyers actually work.</p><div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{categories.map((category) => <CategoryCard description={`${category.children.length} subcategories · ${category.description || "Browse poultry listings"}`} href={`/categories/${category.slug}`} image={category.imagePath || "/images/poultry/live-birds.webp"} key={category.id} name={category.name}/>)}</div></div>;
}
