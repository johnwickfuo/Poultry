import Link from "next/link";

import { buttonStyles } from "@/components";

export function ProductNav({ id }: { id: string }) {
  const links = [["Details", "edit"], ["Variants", "variants"], ["Bulk pricing", "bulk-pricing"], ["Stock", "stock"], ["Images", "images"]];
  return <nav aria-label="Product management" className="mb-6 flex gap-2 overflow-x-auto">{links.map(([label, path]) => <Link className={buttonStyles({ size: "sm", variant: "outline", className: "shrink-0" })} href={`/seller/products/${id}/${path}`} key={path}>{label}</Link>)}</nav>;
}
