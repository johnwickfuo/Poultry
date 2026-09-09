import Link from "next/link";

import { getPublicCategories } from "@/server/categories";
import { getMarketplaceFacets, searchMarketplace } from "@/server/services/marketplace-search";
import { filterFormValues, marketplacePageHref, parseMarketplaceParams, type PublicSearchParams } from "@/server/validation/marketplace";
import { buttonStyles } from "@/components/ui/button";
import { ResponsiveImage } from "@/components/ui/commerce";
import { EmptyState } from "@/components/ui/feedback";
import { Breadcrumb, Pagination } from "@/components/ui/navigation";
import { MarketplaceFilters } from "./marketplace-filters";
import { ProductListingCard } from "./product-listing-card";
import { ResultsToolbar } from "./results-toolbar";

type CategoryPageData = { name: string; slug: string; description: string | null; imagePath: string | null; parent: { name: string; slug: string; imagePath: string | null } | null; children: Array<{ id: string; name: string; slug: string }> };

export async function MarketplaceCategoryPageContent({ category, raw, categorySlug, subcategorySlug }: { category: CategoryPageData; raw: PublicSearchParams; categorySlug: string; subcategorySlug?: string }) {
  const action = subcategorySlug ? `/marketplace/category/${categorySlug}/${subcategorySlug}` : `/marketplace/category/${categorySlug}`;
  const filters = parseMarketplaceParams(raw, { category: categorySlug, subcategory: subcategorySlug });
  const [categories, facets, results] = await Promise.all([getPublicCategories(), getMarketplaceFacets(), searchMarketplace(filters)]);
  const image = category.imagePath || category.parent?.imagePath || "/images/poultry/live-birds.webp";
  return <div><section className="relative isolate overflow-hidden bg-coop text-white"><ResponsiveImage alt="" className="-z-20 opacity-45" fill priority src={image}/><div className="absolute inset-0 -z-10 bg-gradient-to-r from-coop via-coop/90 to-coop/35"/><div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16"><Breadcrumb items={[{ label: "Marketplace", href: "/marketplace" }, ...(category.parent ? [{ label: category.parent.name, href: `/marketplace/category/${category.parent.slug}` }] : []), { label: category.name }]}/><p className="market-label mt-8 text-yolk">{category.parent ? "Poultry subcategory" : "Poultry category"}</p><h1 className="mt-3 max-w-3xl font-display text-4xl font-black sm:text-5xl">{category.name}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">{category.description}</p>{category.children.length ? <nav aria-label={`${category.name} subcategories`} className="mt-6 flex gap-2 overflow-x-auto pb-2">{category.children.map((child) => <Link className="whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white hover:text-coop" href={`/marketplace/category/${category.slug}/${child.slug}`} key={child.id}>{child.name}</Link>)}</nav> : null}</div></section><section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8"><div className="mb-7"><p className="market-label text-sack">Available listings</p><h2 className="mt-2 font-display text-3xl font-black text-coop">Shop {category.name}</h2></div><div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]"><MarketplaceFilters action={action} categories={categories} facets={facets} lockedCategory={categorySlug} lockedSubcategory={subcategorySlug} values={filterFormValues(raw)}/><div><ResultsToolbar action={action} params={raw} total={results.total}/>{results.products.length ? <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">{results.products.map((product) => <ProductListingCard key={product.id} product={product}/>)}</div> : <div className="mt-6"><EmptyState action={<Link className={buttonStyles()} href={action}>Clear filters</Link>} description="Approved seller listings for this category will appear here when available." title={`No ${category.name.toLowerCase()} products found`}/></div>}{results.totalPages > 1 ? <div className="mt-9"><Pagination currentPage={results.page} getHref={(page) => marketplacePageHref(action, raw, page)} totalPages={results.totalPages}/></div> : null}</div></div></section></div>;
}
