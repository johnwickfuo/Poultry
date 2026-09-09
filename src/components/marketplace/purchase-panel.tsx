"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/commerce";
import { Icon } from "@/components/ui/icons";

type Variant = { id: string; name: string; priceKobo: number; stockQuantity: number };

export function PurchasePanel({ basePriceKobo, stockQuantity, minimumOrderQuantity, unitLabel, variants }: { basePriceKobo: number; stockQuantity: number; minimumOrderQuantity: number; unitLabel: string; variants: Variant[] }) {
  const [variantId, setVariantId] = useState(variants[0]?.id || "base");
  const [quantity, setQuantity] = useState(minimumOrderQuantity);
  const [wished, setWished] = useState(false);
  const selected = variants.find((variant) => variant.id === variantId);
  const available = selected ? selected.stockQuantity : stockQuantity;
  const unitPrice = selected?.priceKobo || basePriceKobo;
  const subtotal = useMemo(() => unitPrice * quantity, [quantity, unitPrice]);
  return <div className="rounded-panel border border-coop/10 bg-white p-5 shadow-crate sm:p-6">
    <div className="flex items-baseline gap-2"><Money amount={unitPrice / 100} className="text-3xl text-palm"/><span className="text-sm text-coop/50">per {unitLabel}</span></div>
    <p className={`mt-2 text-sm font-bold ${available > 0 ? "text-palm" : "text-red-700"}`}>{available > 0 ? `${available} available` : "Currently out of stock"}</p>
    {variants.length ? <fieldset className="mt-5"><legend className="text-sm font-bold text-coop">Choose a variant</legend><div className="mt-2 grid gap-2">{variants.map((variant) => <label className={`flex cursor-pointer items-center justify-between rounded-control border p-3 ${variant.id === variantId ? "border-palm bg-palm/5" : "border-coop/15"}`} key={variant.id}><span className="flex items-center gap-3"><input checked={variant.id === variantId} className="accent-palm" name="variant" onChange={() => { setVariantId(variant.id); setQuantity(minimumOrderQuantity); }} type="radio"/><span className="text-sm font-semibold text-coop">{variant.name}</span></span><Money amount={variant.priceKobo / 100} className="text-sm text-palm"/></label>)}</div></fieldset> : null}
    <div className="mt-5"><label className="text-sm font-bold text-coop" htmlFor="quantity">Quantity</label><div className="mt-2 flex items-center gap-2"><button aria-label="Reduce quantity" className="size-11 rounded-control border border-coop/15 bg-eggshell text-xl font-bold" onClick={() => setQuantity((value) => Math.max(minimumOrderQuantity, value - 1))} type="button">−</button><input className="h-11 w-20 rounded-control border border-coop/20 bg-white text-center font-bold text-coop" id="quantity" max={Math.max(minimumOrderQuantity, available)} min={minimumOrderQuantity} onChange={(event) => setQuantity(Math.max(minimumOrderQuantity, Number(event.target.value) || minimumOrderQuantity))} type="number" value={quantity}/><button aria-label="Increase quantity" className="size-11 rounded-control border border-coop/15 bg-eggshell text-xl font-bold" onClick={() => setQuantity((value) => Math.min(Math.max(minimumOrderQuantity, available), value + 1))} type="button">+</button><span className="ml-auto text-sm text-coop/55">Min. {minimumOrderQuantity}</span></div></div>
    <div className="mt-5 flex items-center justify-between border-t border-coop/10 pt-4"><span className="text-sm text-coop/60">Estimated item total</span><Money amount={subtotal / 100} className="text-xl text-coop"/></div>
    <Button className="mt-5 w-full" disabled size="lg"><Icon className="size-5" name="cart"/>Add to cart · Phase 3</Button>
    <Button aria-pressed={wished} className="mt-2 w-full" onClick={() => setWished((value) => !value)} variant="outline"><Icon className={`size-5 ${wished ? "fill-red-600 text-red-600" : ""}`} name="heart"/>{wished ? "Saved for this visit" : "Save to wishlist"}</Button>
  </div>;
}
