import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { acknowledgePriceChangesAction } from "@/app/cart/actions";
import { DeliverySelectionForm } from "@/components/checkout/delivery-selection-form";
import { Card, Money, ResponsiveImage } from "@/components";
import { getCurrentUser } from "@/server/authorization";
import { getRequestCartReview } from "@/server/cart";
import { getCheckoutDeliveryOptions } from "@/server/delivery";
import { NIGERIAN_STATES, nigerianStateSchema } from "@/server/validation/delivery";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };
type PublicSearchParams = { error?: string | string[]; deliveryState?: string | string[] };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function naira(kobo: number) { return kobo / 100; }

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<PublicSearchParams> }) {
  const [query, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (!user) redirect("/login?callbackUrl=/checkout");
  const review = await getRequestCartReview();
  if (!review || !review.items.length) redirect("/cart");

  const requestedState = first(query.deliveryState) || user.profile?.state || "";
  const deliveryState = nigerianStateSchema.safeParse(requestedState);
  const sellerIds = [...new Set(review.items.map((item) => item.product.sellerId))];
  const deliveryGroups = deliveryState.success && !review.hasBlockingIssues
    ? await getCheckoutDeliveryOptions(sellerIds, deliveryState.data)
    : [];

  return <section className="mx-auto max-w-6xl">
    <Link className="text-sm font-bold text-palm hover:underline" href="/cart">← Back to cart</Link>
    <div className="mt-5"><p className="market-label text-sack">Secure checkout</p><h1 className="mt-2 font-display text-3xl font-black text-coop sm:text-4xl">Review your poultry order</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-coop/60">Each seller receives a separate fulfilment order. Delivery is selected seller by seller.</p></div>
    {first(query.error) ? <p className="mt-5 rounded-control border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{first(query.error)}</p> : null}
    <Card className="mt-7 p-5"><form className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end" method="get"><label className="grid gap-2 text-sm font-bold text-coop">Delivery state<select className="min-h-11 rounded-control border border-coop/15 bg-white px-3 font-normal" defaultValue={deliveryState.success ? deliveryState.data : ""} name="deliveryState"><option value="">Select your Nigerian state</option>{NIGERIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}</select></label><button className="min-h-11 rounded-control bg-coop px-4 text-sm font-bold text-white hover:bg-coop/90" type="submit">Check delivery options</button></form></Card>
    <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_22rem]"><div className="space-y-3">{review.items.map((item) => <Card className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-4 p-4" key={item.id}><div className="relative aspect-square overflow-hidden rounded-control bg-eggshell"><ResponsiveImage alt="" fill src={item.product.images[0]?.path || "/images/poultry/live-birds.webp"}/></div><div><h2 className="font-bold text-coop">{item.product.name}</h2><p className="mt-1 text-sm text-coop/55">{item.product.seller.sellerProfile?.businessName || item.product.seller.username} · Qty {item.quantity}</p>{item.issue ? <p className="mt-1 text-xs font-semibold text-red-700">{item.issue}</p> : null}{item.priceChanged ? <p className="mt-1 text-xs font-semibold text-sack">Price changed — review required.</p> : null}</div><Money amount={naira(item.currentUnitPriceKobo * item.quantity)} className="text-base text-palm"/></Card>)}</div>
      <aside><Card className="p-5"><h2 className="font-display text-xl font-bold text-coop">Order summary</h2><div className="mt-5 flex justify-between text-sm text-coop/65"><span>Products</span><Money amount={naira(review.currentSubtotalKobo)}/></div><div className="mt-4 border-t border-coop/10 pt-4 text-sm text-coop/60">Delivery is calculated after you choose a method for every seller.</div>{review.hasBlockingIssues ? <Link className="mt-5 inline-flex rounded-control bg-coop px-4 py-3 text-sm font-bold text-white" href="/cart">Fix cart issues</Link> : review.hasPriceChanges ? <form action={acknowledgePriceChangesAction}><button className="mt-5 w-full rounded-control bg-palm px-4 py-3 text-sm font-bold text-white" type="submit">Accept current prices</button></form> : !deliveryState.success ? <p className="mt-5 rounded-control bg-yolk/20 p-3 text-sm font-semibold text-coop">Select your delivery state to continue.</p> : <p className="mt-5 rounded-control bg-leaf/10 p-3 text-sm font-semibold text-coop">Choose delivery for each seller below.</p>}</Card></aside>
    </div>
    {!review.hasBlockingIssues && !review.hasPriceChanges && deliveryState.success ? <section className="mt-8"><h2 className="font-display text-2xl font-bold text-coop">Delivery selections</h2><p className="mt-2 text-sm text-coop/60">Your full pickup address stays private until payment is verified.</p><DeliverySelectionForm buyerState={deliveryState.data} groups={deliveryGroups} productSubtotalKobo={review.currentSubtotalKobo}/></section> : null}
  </section>;
}
