import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumb, Card, EmptyState, ResponsiveImage } from "@/components";
import { getPublicCategoryBySlug } from "@/server/categories";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const category = await getPublicCategoryBySlug((await params).slug);
  if (!category) return { title: "Category not found" };
  return { title: `${category.name} | Poultry marketplace`, description: category.description || `Browse ${category.name.toLowerCase()} in the poultry marketplace.` };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const category = await getPublicCategoryBySlug((await params).slug);
  if (!category) notFound();
  const image = category.imagePath || category.parent?.imagePath || "/images/poultry/live-birds.webp";
  return <div><section className="relative isolate overflow-hidden bg-coop text-white"><ResponsiveImage alt="" className="-z-20 opacity-45" fill priority src={image}/><div className="absolute inset-0 -z-10 bg-gradient-to-r from-coop via-coop/85 to-coop/35"/><div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16"><Breadcrumb items={[{ label: "Categories", href: "/categories" }, ...(category.parent ? [{ label: category.parent.name, href: `/categories/${category.parent.slug}` }] : []), { label: category.name }]}/><p className="market-label mt-8 text-yolk">{category.parent ? "Poultry subcategory" : "Marketplace category"}</p><h1 className="mt-3 max-w-3xl font-display text-4xl font-black sm:text-5xl">{category.name}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-white/75">{category.description}</p></div></section><section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">{category.children.length ? <><p className="market-label text-sack">Browse within {category.name}</p><h2 className="mt-3 font-display text-3xl font-black text-coop">Active subcategories</h2><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{category.children.map((subcategory) => <Link href={`/categories/${subcategory.slug}`} key={subcategory.id}><Card className="h-full p-5 transition hover:-translate-y-0.5 hover:border-palm/40"><h3 className="font-display text-xl font-bold text-coop">{subcategory.name}</h3><p className="mt-2 text-sm leading-6 text-coop/65">{subcategory.description}</p><span className="mt-4 inline-block text-sm font-bold text-palm">Browse listings →</span></Card></Link>)}</div></> : <EmptyState description="Product listings for this subcategory will appear here as sellers publish their catalogue." title={`No ${category.name.toLowerCase()} listings yet`}/>}</section></div>;
}
