import type { Metadata } from "next";
import Link from "next/link";

import { Card, EmptyState, Money, StatusBadge, buttonStyles } from "@/components";
import { requireUser } from "@/server/authorization";
import { listOrdersForBuyer } from "@/server/orders";

export const metadata: Metadata = {
  title: "My orders",
  robots: { index: false, follow: false },
};

function statusTone(status: string) {
  if (status === "COMPLETED" || status === "PAID") return "success" as const;
  if (status === "CANCELLED") return "error" as const;
  if (status === "REFUNDED") return "draft" as const;
  if (status === "PARTIALLY_FULFILLED") return "warning" as const;
  return "pending" as const;
}

function naira(kobo: bigint) {
  return Number(kobo) / 100;
}

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await listOrdersForBuyer(user.id);

  return <section><p className="market-label text-sack">Purchase history</p><h1 className="mt-2 font-display text-4xl font-black text-coop">My orders</h1><p className="mt-3 text-coop/60">Each order is separated into seller fulfilment units for clearer tracking.</p><div className="mt-7 space-y-4">{orders.length ? orders.map((order) => <Card className="p-5" key={order.id}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-sm font-bold text-coop">{order.reference}</p><p className="mt-1 text-sm text-coop/50">{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(order.createdAt)} · {order.subOrders.length} seller {order.subOrders.length === 1 ? "order" : "orders"}</p></div><StatusBadge status={statusTone(order.status)}/></div><div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-coop/8 pt-4"><div><p className="text-xs font-bold uppercase tracking-wide text-coop/45">Grand total</p><Money amount={naira(order.grandTotalKobo)} className="mt-1 text-2xl text-palm"/></div><Link className={buttonStyles({ variant: "outline" })} href={`/account/orders/${order.reference}`}>View order</Link></div></Card>) : <EmptyState action={<Link className={buttonStyles()} href="/marketplace">Browse marketplace</Link>} description="Orders created from your poultry marketplace cart will appear here." icon="cart" title="No orders yet"/>}</div></section>;
}
