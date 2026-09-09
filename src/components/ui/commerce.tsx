import Image, { type ImageProps } from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { Badge } from "./feedback";
import { Icon } from "./icons";

export function Money({ amount, currency = "NGN", className }: { amount: number | string; currency?: string; className?: string }) {
  const numericAmount = typeof amount === "string" ? Number(amount) : amount;
  const formatted = new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: currency === "NGN" ? 0 : 2 }).format(numericAmount);
  return <data className={cn("font-bold tabular-nums", className)} value={numericAmount}>{formatted}</data>;
}

export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  const safeValue = Math.max(0, Math.min(5, value));
  return <span aria-label={`${safeValue} out of 5 stars${count === undefined ? "" : ` from ${count} reviews`}`} className={cn("inline-flex items-center gap-1 text-sm", className)}><span className="flex text-yolk" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <Icon className={cn("size-4", index + 1 > Math.round(safeValue) && "fill-transparent text-coop/20")} fill={index + 1 <= Math.round(safeValue) ? "currentColor" : "none"} key={index} name="star"/>)}</span><span className="font-semibold text-coop">{safeValue.toFixed(1)}</span>{count === undefined ? null : <span className="text-coop/50">({count})</span>}</span>;
}

export function ResponsiveImage({ alt, className, sizes = "(max-width: 768px) 100vw, 50vw", ...props }: ImageProps) {
  return <Image alt={alt} className={cn("object-cover", className)} sizes={sizes} {...props}/>;
}

export type ProductCardProps = {
  href: string;
  image: ImageProps["src"];
  name: string;
  price: number;
  unit?: string;
  location?: string;
  seller?: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  variantSummary?: string;
  inStock?: boolean;
  hasBulkPricing?: boolean;
};

export function ProductCard({ href, image, name, price, unit, location, seller, rating, reviewCount, badge, variantSummary, inStock = true, hasBulkPricing = false }: ProductCardProps) {
  return <article className="group overflow-hidden rounded-card border border-coop/10 bg-white shadow-crate transition hover:-translate-y-0.5 hover:border-palm/25"><Link className="flex h-full flex-col" href={href}><div className="relative aspect-square overflow-hidden bg-eggshell"><ResponsiveImage alt={name} className="transition duration-300 group-hover:scale-[1.03]" fill src={image}/><div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">{badge ? <Badge tone="yolk">{badge}</Badge> : <span/>}<span className={cn("rounded-full px-2.5 py-1 text-[11px] font-extrabold shadow-label", inStock ? "bg-white text-palm" : "bg-coop text-white")}>{inStock ? "In stock" : "Out of stock"}</span></div></div><div className="flex flex-1 flex-col p-4">{seller ? <p className="mb-1 truncate text-xs font-bold uppercase tracking-[0.08em] text-sack">{seller}</p> : null}<h3 className="line-clamp-2 min-h-12 font-semibold text-coop">{name}</h3>{variantSummary ? <p className="mt-1 line-clamp-1 text-xs text-coop/55">{variantSummary}</p> : null}<div className="mt-3 flex items-baseline gap-1"><Money amount={price} className="text-lg text-palm"/>{unit ? <span className="text-xs text-coop/50">/ {unit}</span> : null}</div>{hasBulkPricing ? <p className="mt-1 text-xs font-bold text-sack">Bulk price available</p> : null}{rating === undefined ? null : <div className="mt-2"><Rating count={reviewCount} value={rating}/></div>}{location ? <p className="mt-auto border-t border-coop/8 pt-3 text-xs font-medium text-coop/55">{location}</p> : null}</div></Link></article>;
}

export function CategoryCard({ href, image, name, description }: { href: string; image: ImageProps["src"]; name: string; description?: string }) {
  return <Link className="group relative isolate min-h-56 overflow-hidden rounded-card bg-coop text-white shadow-crate" href={href}><ResponsiveImage alt="" className="-z-20 transition duration-500 group-hover:scale-105" fill src={image}/><span className="absolute inset-0 -z-10 bg-gradient-to-t from-coop via-coop/30 to-transparent"/><span className="absolute inset-x-0 bottom-0 p-5"><span className="font-display text-2xl font-bold">{name}</span>{description ? <span className="mt-1 block text-sm text-white/75">{description}</span> : null}<span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-yolk">Browse category <Icon className="size-4" name="arrow"/></span></span></Link>;
}
