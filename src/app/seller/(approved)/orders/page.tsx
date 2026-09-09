import { EmptyState } from "@/components";

export default function SellerOrdersPage() {
  return <section><p className="market-label text-sack">Fulfilment</p><h1 className="mt-3 font-display text-4xl font-black text-coop">Orders</h1><div className="mt-7"><EmptyState description="Marketplace orders will appear here once catalogue ordering is enabled." title="No orders yet"/></div></section>;
}
