"use client";

import { useMemo, useState } from "react";

import { createOrderAction } from "@/app/checkout/actions";
import { Money, buttonStyles } from "@/components";

type DeliveryOption = {
  method: "SELLER_ARRANGED" | "BUYER_PICKUP" | "QUOTE_REQUIRED";
  feeKobo: number;
  label: string;
};

type SellerDeliveryGroup = {
  sellerId: string;
  sellerName: string;
  pickupArea: string | null;
  missingRate: boolean;
  options: DeliveryOption[];
};

export function DeliverySelectionForm({ buyerState, productSubtotalKobo, groups }: { buyerState: string; productSubtotalKobo: number; groups: SellerDeliveryGroup[] }) {
  const [selections, setSelections] = useState<Record<string, DeliveryOption>>(() => Object.fromEntries(groups.filter(({ options }) => options[0]).map(({ sellerId, options }) => [sellerId, options[0]])));
  const deliveryTotalKobo = useMemo(() => Object.values(selections).reduce((sum, option) => sum + option.feeKobo, 0), [selections]);
  const complete = groups.length > 0 && groups.every(({ sellerId }) => selections[sellerId]);

  return <form action={createOrderAction} className="mt-6 space-y-4"><input name="buyerState" type="hidden" value={buyerState}/>{groups.map((group) => <fieldset className="rounded-card border border-coop/10 p-4" key={group.sellerId}><legend className="px-1 font-display text-lg font-bold text-coop">{group.sellerName}</legend><div className="mt-2 space-y-2">{group.options.map((option) => <label className="flex cursor-pointer items-start justify-between gap-4 rounded-control border border-coop/10 bg-white p-3 has-[:checked]:border-palm has-[:checked]:bg-palm/5" key={option.method}><span className="flex items-start gap-3"><input checked={selections[group.sellerId]?.method === option.method} className="mt-1 size-4 accent-palm" name={`deliveryMethod:${group.sellerId}`} onChange={() => setSelections((current) => ({ ...current, [group.sellerId]: option }))} type="radio" value={option.method}/><span><span className="block text-sm font-bold text-coop">{option.label}</span>{option.method === "BUYER_PICKUP" ? <span className="mt-1 block text-xs leading-5 text-coop/50">Full collection address is revealed only after verified payment.</span> : null}</span></span><Money amount={option.feeKobo / 100} className="shrink-0 text-sm text-palm"/></label>)}{!group.options.length ? <p className="rounded-control bg-red-50 p-3 text-sm font-semibold text-red-800">No supported delivery method is available for this seller and state. Ask the seller to add a state rate or enable pickup.</p> : null}{group.missingRate && group.options.some(({ method }) => method === "BUYER_PICKUP") ? <p className="text-xs leading-5 text-sack">No seller-arranged rate exists for {buyerState}; pickup is still available.</p> : null}</div></fieldset>)}<div className="rounded-card bg-coop p-5 text-white"><div className="flex items-center justify-between text-sm text-white/65"><span>Products</span><Money amount={productSubtotalKobo / 100}/></div><div className="mt-2 flex items-center justify-between text-sm text-white/65"><span>Delivery</span><Money amount={deliveryTotalKobo / 100}/></div><div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4"><span className="font-bold">Order total</span><Money amount={(productSubtotalKobo + deliveryTotalKobo) / 100} className="text-2xl text-yolk"/></div><button className={buttonStyles({ className: "mt-5 w-full", size: "lg", variant: "secondary" })} disabled={!complete} type="submit">Create order</button></div></form>;
}
