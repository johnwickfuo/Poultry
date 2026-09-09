import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumb, EmptyState, Pagination, ProductListingCard, ResponsiveImage } from "@/components";
import { getPublicSellerProducts, getPublicSellerStorefront } from "@/server/services/marketplace-search";
import { firstParam, marketplacePageHref, type PublicSearchParams } from "@/server/validation/marketplace";

type Props = { params: Promise<{ sellerSlug: string }>; searchParams: Promise<PublicSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const seller = await getPublicSellerStorefront((await params).sellerSlug);
  if (!seller) return { title: "Seller not found" };
  const name = seller.sellerProfile?.businessName || seller.username;
  return { title: `${name} poultry storefront`, description: seller.sellerProfile?.description || `Shop approved poultry listings from ${name}.`, alternates: { canonical: `/marketplace/sellers/${seller.username}` } };
}

export default async function SellerStorefrontPage({ params, searchParams }: Props) {
  const { sellerSlug } = await params;
  const raw = await searchParams;
  const page = Math.max(1, Number.parseInt(firstParam(raw.page) || "1", 10) || 1);
  const [seller, results] = await Promise.all([getPublicSellerStorefront(sellerSlug), getPublicSellerProducts(sellerSlug, page)]);
  if (!seller?.sellerProfile) notFound();
  const profile = seller.sellerProfile;
  const name = profile.businessName || seller.username;
  const location = [profile.lga, profile.state].filter(Boolean).join(", ");
  return <div><section className="bg-coop text-white"><div className="hatchery-grid-dark mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14"><Breadcrumb items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Sellers" }, { label: name }]}/><div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center"><div className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-panel border-2 border-yolk bg-yolk font-display text-4xl font-black text-coop">{profile.logoPath ? <ResponsiveImage alt={`${name} logo`} fill priority src={profile.logoPath}/> : name.charAt(0)}</div><div><p className="market-label text-yolk">Approved poultry seller</p><h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">{name}</h1>{location ? <p className="mt-2 text-white/65">{location}</p> : null}</div></div></div></section><section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:px-8 lg:py-14"><aside><div className="rounded-card border border-coop/10 bg-white p-5 shadow-label"><h2 className="font-display text-xl font-bold text-coop">About this seller</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-coop/65">{profile.description || "Approved poultry marketplace seller."}</p><dl className="mt-5 space-y-3 border-t border-coop/10 pt-4 text-sm">{profile.businessType ? <div><dt className="font-bold text-coop/45">Business type</dt><dd className="text-coop">{profile.businessType}</dd></div> : null}{location ? <div><dt className="font-bold text-coop/45">Location</dt><dd className="text-coop">{location}</dd></div> : null}</dl>{profile.phone || profile.email || profile.whatsapp ? <div className="mt-5 space-y-2 border-t border-coop/10 pt-4 text-sm">{profile.phone ? <a className="block font-semibold text-palm" href={`tel:${profile.phone}`}>Call {profile.phone}</a> : null}{profile.email ? <a className="block font-semibold text-palm" href={`mailto:${profile.email}`}>Email seller</a> : null}{profile.whatsapp ? <a className="block font-semibold text-palm" href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`} rel="noreferrer" target="_blank">Chat on WhatsApp</a> : null}</div> : null}</div></aside><div><p className="market-label text-sack">Seller catalogue</p><div className="mt-2 flex items-end justify-between gap-4"><h2 className="font-display text-3xl font-black text-coop">Products from {name}</h2><span className="text-sm text-coop/55">{results.total} listings</span></div>{results.products.length ? <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">{results.products.map((product) => <ProductListingCard key={product.id} product={product}/>)}</div> : <div className="mt-6"><EmptyState description="This approved seller has no public listings at the moment." title="No products published"/></div>}{results.totalPages > 1 ? <div className="mt-9"><Pagination currentPage={results.page} getHref={(nextPage) => marketplacePageHref(`/marketplace/sellers/${sellerSlug}`, raw, nextPage)} totalPages={results.totalPages}/></div> : null}<Link className="mt-8 inline-block text-sm font-bold text-palm" href="/marketplace">← Back to marketplace</Link></div></section></div>;
}
