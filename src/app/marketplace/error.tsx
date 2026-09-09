"use client";

import { Button, EmptyState } from "@/components";

export default function MarketplaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="mx-auto max-w-3xl px-5 py-20"><EmptyState action={<Button onClick={reset}>Try again</Button>} description="The marketplace could not load just now. Please retry; no order or account information was changed." icon="search" title="We could not load the market"/></div>;
}
