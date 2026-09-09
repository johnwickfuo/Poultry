import { EmptyState } from "@/components";

export default function SellerProductsPage() {
  return <section><p className="market-label text-sack">Catalogue</p><h1 className="mt-3 font-display text-4xl font-black text-coop">Products</h1><div className="mt-7"><EmptyState description="Product creation will be added here. Your approved seller access is already enforced for this route." title="Your catalogue is ready"/></div></section>;
}
