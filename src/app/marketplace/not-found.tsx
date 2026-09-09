import Link from "next/link";

import { EmptyState, buttonStyles } from "@/components";

export default function MarketplaceNotFound() {
  return <div className="mx-auto max-w-3xl px-5 py-20"><EmptyState action={<Link className={buttonStyles()} href="/marketplace">Browse the marketplace</Link>} description="This product, category or seller may no longer be public, or the address may be incorrect." icon="search" title="Marketplace page not found"/></div>;
}
