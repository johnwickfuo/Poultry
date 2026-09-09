import Link from "next/link";

import { ResponsiveImage } from "@/components/ui/commerce";

type Category = { id: string; name: string; slug: string; imagePath: string | null; children: Array<{ id: string; name: string; slug: string }> };

export function MarketplaceCategoryStrip({ categories }: { categories: Category[] }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{categories.slice(0, 10).map((category) => <article className="group overflow-hidden rounded-card border border-coop/10 bg-white shadow-label" key={category.id}><Link href={`/marketplace/category/${category.slug}`}><div className="relative aspect-[4/3] overflow-hidden bg-eggshell"><ResponsiveImage alt={category.name} className="transition duration-300 group-hover:scale-105" fill src={category.imagePath || "/images/poultry/live-birds.webp"}/></div><div className="p-3"><h3 className="font-display text-base font-bold leading-tight text-coop">{category.name}</h3><p className="mt-1 text-xs text-coop/55">{category.children.length} sections</p></div></Link></article>)}</div>;
}
