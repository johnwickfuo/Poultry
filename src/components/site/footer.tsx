import Link from "next/link";

import { BrandMark } from "./brand-mark";

type FooterBranding = { companyName: string; companyShortName: string; tagline: string; email: string; phone: string; whatsapp: string; address: string; rcNumber: string; logoDark: string; socialLinks: Record<string, string> };

export function SiteFooter({ branding }: { branding: FooterBranding }) {
  const year = new Date().getFullYear();
  return <footer className="bg-coop text-white"><div className="hatchery-grid-dark mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8"><div className="lg:col-span-2"><BrandMark companyName={branding.companyName} inverse logo={branding.logoDark} shortName={branding.companyShortName}/><p className="mt-4 max-w-md text-sm leading-6 text-white/65">{branding.tagline || "Practical poultry commerce, trusted farm connections and knowledge for better production."}</p>{branding.address ? <p className="mt-4 text-sm text-white/65">{branding.address}</p> : null}</div><FooterList title="Marketplace" links={[{ label: "Live birds", href: "/marketplace/category/live-birds" }, { label: "Eggs", href: "/marketplace/category/eggs" }, { label: "Day-old chicks", href: "/marketplace/category/day-old-chicks-poults" }, { label: "Feed & supplies", href: "/marketplace/category/poultry-feed" }]}/><div><h2 className="market-label text-yolk">Contact</h2><ul className="mt-4 space-y-3 text-sm text-white/70">{branding.email ? <li><a className="hover:text-yolk" href={`mailto:${branding.email}`}>{branding.email}</a></li> : null}{branding.phone ? <li><a className="hover:text-yolk" href={`tel:${branding.phone}`}>{branding.phone}</a></li> : null}{branding.whatsapp ? <li><a className="hover:text-yolk" href={`https://wa.me/${branding.whatsapp.replace(/\D/g, "")}`}>WhatsApp: {branding.whatsapp}</a></li> : null}{Object.entries(branding.socialLinks).map(([name, url]) => <li key={name}><a className="capitalize hover:text-yolk" href={url} rel="noreferrer" target="_blank">{name}</a></li>)}</ul></div></div><div className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><p>© {year} {branding.companyName}. All rights reserved.</p><p>{branding.rcNumber ? `RC ${branding.rcNumber}` : "Built for Nigeria’s poultry value chain."}</p></div></div></footer>;
}

function FooterList({ title, links }: { title: string; links: Array<{ label: string; href: string }> }) {
  return <div><h2 className="market-label text-yolk">{title}</h2><ul className="mt-4 space-y-3 text-sm text-white/70">{links.map((link) => <li key={link.href}><Link className="hover:text-yolk" href={link.href}>{link.label}</Link></li>)}</ul></div>;
}
