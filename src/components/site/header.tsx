"use client";

import Link from "next/link";
import { useState } from "react";

import { Drawer } from "@/components/ui/overlays";
import { IconButton, buttonStyles } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { BrandMark } from "./brand-mark";

const mobileLinks = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/categories", label: "Categories" },
  { href: "/learn", label: "Learn" },
  { href: "/mentors", label: "Ask a mentor" },
];

export function SiteHeader({ companyName, shortName, logo }: { companyName: string; shortName: string; logo?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <><header className="sticky top-0 z-40 border-b border-coop/10 bg-eggshell/95 backdrop-blur"><div className="border-b border-coop/8 bg-coop px-4 py-1.5 text-center text-xs font-semibold text-white"><span className="text-yolk">Farm-gate buying:</span> verify quantities, location and collection terms before payment.</div><div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8"><IconButton className="lg:hidden" label="Open navigation" onClick={() => setMenuOpen(true)}><Icon className="size-5" name="menu"/></IconButton><BrandMark className="shrink-0" companyName={companyName} logo={logo} shortName={shortName}/><form action="/search" className="relative mx-auto hidden w-full max-w-2xl md:block" role="search"><label className="sr-only" htmlFor="site-search">Search products</label><input className="h-12 w-full rounded-control border-2 border-coop/15 bg-white pl-12 pr-28 text-sm text-coop outline-none placeholder:text-coop/45 focus:border-palm" id="site-search" name="q" placeholder="Search birds, eggs, feed, equipment…"/><Icon className="absolute left-4 top-3.5 size-5 text-coop/45" name="search"/><button className="absolute bottom-1.5 right-1.5 top-1.5 rounded-md bg-palm px-5 text-sm font-bold text-white hover:bg-coop" type="submit">Search</button></form><div className="ml-auto flex items-center gap-1"><Link className="hidden min-h-11 items-center gap-2 rounded-control px-3 text-sm font-semibold text-coop hover:bg-coop/5 lg:flex" href="/categories"><Icon className="size-5" name="categories"/>Categories</Link><Link aria-label="Wishlist" className="grid size-11 place-items-center rounded-control text-coop hover:bg-coop/5" href="/wishlist"><Icon className="size-5" name="heart"/></Link><Link aria-label="Cart" className="relative grid size-11 place-items-center rounded-control text-coop hover:bg-coop/5" href="/cart"><Icon className="size-5" name="cart"/><span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-yolk text-[10px] font-black text-coop">0</span></Link><Link className="hidden min-h-11 items-center gap-2 rounded-control px-3 text-sm font-semibold text-coop hover:bg-coop/5 sm:flex" href="/account"><Icon className="size-5" name="account"/>Account</Link></div></div><form action="/search" className="relative mx-4 mb-3 md:hidden" role="search"><label className="sr-only" htmlFor="mobile-search">Search products</label><input className="h-11 w-full rounded-control border border-coop/20 bg-white pl-10 pr-4 text-sm outline-none focus:border-palm" id="mobile-search" name="q" placeholder="Search the marketplace"/><Icon className="absolute left-3 top-3 size-5 text-coop/45" name="search"/></form></header><Drawer onClose={() => setMenuOpen(false)} open={menuOpen} side="left" title="Browse"><nav className="space-y-1">{mobileLinks.map((link) => <Link className="flex min-h-12 items-center justify-between rounded-control px-3 font-semibold text-coop hover:bg-palm/8 hover:text-palm" href={link.href} key={link.href} onClick={() => setMenuOpen(false)}>{link.label}<Icon className="size-4" name="chevron"/></Link>)}</nav><div className="mt-6 border-t border-coop/10 pt-6"><Link className={buttonStyles({ className: "w-full" })} href="/account">Go to your account</Link></div></Drawer></>;
}
