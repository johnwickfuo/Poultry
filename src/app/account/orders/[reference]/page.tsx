import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, Card, Money, ResponsiveImage, StatusBadge } from "@/components";
import { requireUser } from "@/server/authorization";
import { getOrderForBuyer } from "@/server/orders";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

function statusTone(status: string) {
  if (["COMPLETED", "PAID", "DELIVERED", "SETTLED"].includes(status)) return "success" as const;
  if (["CANCELLED", "REJECTED"].includes(status)) return "error" as const;
  if (["REFUNDED"].includes(status)) return "draft" as const;
  if (["PARTIALLY_FULFILLED", "SHIPPED", "DISPUTED"].includes(status)) return "warning" as const;
  return "pending" as const;
}

function naira(kobo: bigint) {
  return Number(kobo) / 100;
}

function label(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}

export default async function OrderPage({ params }: { params: Promise<{ reference: string }> }) {
  const [{ reference }, user] = await Promise.all([params, requireUser()]);
  const order = await getOrderForBuyer(user.id, reference);
  if (!order) notFound();

  return <section><Link className="text-sm font-bold text-palm hover:underline" href="/account/orders">← All orders</Link><div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><p className="market-label text-sack">Buyer order</p><h1 className="mt-2 font-display text-3xl font-black text-coop sm:text-4xl">{order.reference}</h1><p className="mt-2 text-sm text-coop/55">Created {new Intl.DateTimeFormat("en-NG", { dateStyle: "long", timeStyle: "short" }).format(order.createdAt)}</p></div><StatusBadge status={statusTone(order.status)}/></div><Card className="mt-7 grid gap-5 p-5 sm:grid-cols-3"><div><p className="text-xs font-bold uppercase tracking-wide text-coop/45">Products</p><Money amount={naira(order.subtotalKobo)} className="mt-1 text-xl text-coop"/></div><div><p className="text-xs font-bold uppercase tracking-wide text-coop/45">Delivery</p><Money amount={naira(order.deliveryTotalKobo)} className="mt-1 text-xl text-coop"/></div><div><p className="text-xs font-bold uppercase tracking-wide text-coop/45">Grand total</p><Money amount={naira(order.grandTotalKobo)} className="mt-1 text-2xl text-palm"/></div></Card><div className="mt-8 space-y-6">{order.subOrders.map((subOrder, index) => <Card className="overflow-hidden" key={subOrder.id}><div className="flex flex-wrap items-center justify-between gap-3 border-b border-coop/8 bg-eggshell/55 px-5 py-4"><div><p className="market-label text-sack">Seller shipment {index + 1}</p><h2 className="mt-1 font-display text-xl font-bold text-coop">{subOrder.seller.sellerProfile?.businessName || subOrder.seller.username}</h2></div><div className="flex items-center gap-2"><Badge>{label(subOrder.deliveryMethod)}</Badge><StatusBadge status={statusTone(subOrder.status)}/></div></div><div className="divide-y divide-coop/8">{subOrder.items.map((item) => <article className="grid gap-4 p-5 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:items-center" key={item.id}><div className="relative aspect-square overflow-hidden rounded-control bg-eggshell"><ResponsiveImage alt="" fill src={item.productImagePath || "/images/poultry/live-birds.webp"}/></div><div><h3 className="font-bold text-coop">{item.productName}</h3><p className="mt-1 text-sm text-coop/55">{item.variantLabel || "Standard item"}{item.sku ? ` · SKU ${item.sku}` : ""} · Qty {item.quantity}</p><p className="mt-1 text-xs text-coop/45"><Money amount={naira(item.unitPriceKobo)}/> each</p></div><Money amount={naira(item.lineTotalKobo)} className="text-lg text-palm"/></article>)}</div><div className="grid gap-3 border-t border-coop/8 px-5 py-4 text-sm sm:grid-cols-3"><p><span className="text-coop/50">Items:</span> <Money amount={naira(subOrder.subtotalKobo)}/></p><p><span className="text-coop/50">Delivery:</span> <Money amount={naira(subOrder.deliveryFeeKobo)}/></p><p className="sm:text-right"><span className="text-coop/50">Seller order total:</span> <Money amount={naira(subOrder.subtotalKobo + subOrder.deliveryFeeKobo)}/></p></div></Card>)}</div><p className="mt-6 rounded-control bg-yolk/20 px-4 py-3 text-sm leading-6 text-coop/70">Payment is pending. Creating this order did not reserve or reduce product stock.</p></section>;
}
