"use client";

import Link from "next/link";

import { cn } from "@/lib/cn";
import { Icon } from "./icons";

export function Tabs({ tabs, active, onChange, label = "Sections" }: { tabs: Array<{ id: string; label: string; disabled?: boolean }>; active: string; onChange: (id: string) => void; label?: string }) {
  return <div aria-label={label} className="flex gap-1 overflow-x-auto rounded-card border border-coop/10 bg-white p-1.5" role="tablist">{tabs.map((tab) => <button aria-selected={active === tab.id} className={cn("min-h-10 whitespace-nowrap rounded-control px-4 text-sm font-semibold transition", active === tab.id ? "bg-palm text-white" : "text-coop/65 hover:bg-coop/5 hover:text-coop")} disabled={tab.disabled} key={tab.id} onClick={() => onChange(tab.id)} role="tab" type="button">{tab.label}</button>)}</div>;
}

export function Pagination({ currentPage, totalPages, getHref }: { currentPage: number; totalPages: number; getHref: (page: number) => string }) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1);
  return <nav aria-label="Pagination" className="flex items-center justify-center gap-1"><Link aria-disabled={currentPage <= 1} className={cn("flex size-10 items-center justify-center rounded-control border border-coop/15 bg-white", currentPage <= 1 && "pointer-events-none opacity-40")} href={getHref(Math.max(1, currentPage - 1))}><Icon className="size-4 rotate-180" name="chevron"/><span className="sr-only">Previous page</span></Link>{pages.map((page, index) => <span className="contents" key={page}>{index > 0 && pages[index - 1] !== page - 1 ? <span className="px-1 text-coop/45">…</span> : null}<Link aria-current={page === currentPage ? "page" : undefined} className={cn("flex size-10 items-center justify-center rounded-control border text-sm font-bold", page === currentPage ? "border-palm bg-palm text-white" : "border-coop/15 bg-white text-coop hover:border-palm")} href={getHref(page)}>{page}</Link></span>)}</nav>;
}

export function Breadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  return <nav aria-label="Breadcrumb"><ol className="flex flex-wrap items-center gap-1.5 text-sm text-coop/60">{items.map((item, index) => <li className="flex items-center gap-1.5" key={`${item.label}-${index}`}>{index ? <Icon className="size-3.5" name="chevron"/> : null}{item.href ? <Link className="hover:text-palm" href={item.href}>{item.label}</Link> : <span aria-current="page" className="font-semibold text-coop">{item.label}</span>}</li>)}</ol></nav>;
}
