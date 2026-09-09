import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";

export function BrandMark({ companyName, shortName, logo, inverse = false, href = "/", className }: { companyName: string; shortName: string; logo?: string; inverse?: boolean; href?: string; className?: string }) {
  return <Link aria-label={`${companyName} home`} className={cn("inline-flex min-w-0 items-center gap-2.5", className)} href={href}>{logo ? <Image alt="" className="h-10 w-auto max-w-28 object-contain" height={40} src={logo} unoptimized width={112}/> : <span aria-hidden="true" className={cn("hatchery-mark grid size-10 shrink-0 place-items-center rounded-control border-2 font-display text-lg font-black", inverse ? "border-yolk bg-yolk text-coop" : "border-palm bg-eggshell text-palm")}>P</span>}<span className={cn("truncate font-display text-lg font-black tracking-tight", inverse ? "text-white" : "text-coop")}>{shortName || companyName}</span></Link>;
}
