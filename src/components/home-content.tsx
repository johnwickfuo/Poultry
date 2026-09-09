import Link from "next/link";

import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { buttonStyles } from "@/components/ui/button";
import { CategoryCard, ResponsiveImage } from "@/components/ui/commerce";
import { Icon } from "@/components/ui/icons";

const defaultCategories = [
  { name: "Live birds", description: "Broilers, layers and point-of-lay birds", image: "/images/poultry/live-birds.webp", href: "/categories/live-birds" },
  { name: "Fresh eggs", description: "Table eggs by crate, tray or bulk order", image: "/images/poultry/eggs.webp", href: "/categories/eggs" },
  { name: "Day-old chicks", description: "Hatchery listings and scheduled supply", image: "/images/poultry/day-old-chicks.webp", href: "/categories/day-old-chicks" },
  { name: "Feed & supplements", description: "Practical inputs for every production stage", image: "/images/poultry/feed.webp", href: "/categories/feed" },
];

type HomeBranding = {
  companyName: string;
  companyShortName?: string;
  tagline: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  rcNumber?: string;
  logo?: string;
  logoDark?: string;
  socialLinks?: Record<string, string>;
};

export function HomeContent({ companyName, companyShortName, tagline, email = "", phone = "", whatsapp = "", address = "", rcNumber = "", logo = "", logoDark = "", socialLinks = {}, categories = defaultCategories }: HomeBranding & { categories?: Array<{ name: string; description: string; image: string; href: string }> }) {
  const shortName = companyShortName || companyName;

  return (
    <div className="min-h-screen bg-eggshell">
      <SiteHeader companyName={companyName} logo={logo} shortName={shortName} />
      <main>
        <section className="relative overflow-hidden border-b border-coop/10">
          <div className="hatchery-grid absolute inset-0 opacity-70" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:py-20">
            <div>
              <p className="market-label inline-flex items-center gap-2 rounded-full border border-sack/20 bg-white px-3 py-2 text-sack shadow-label">
                <span className="size-2 rounded-full bg-yolk" />
                Nigeria’s practical poultry marketplace
              </p>
              <h1 className="mt-6 max-w-3xl font-display text-4xl font-black leading-[1.05] tracking-[-0.035em] text-coop sm:text-5xl lg:text-6xl">
                Buy from farms. Sell with confidence. <span className="text-palm">Grow with knowledge.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-coop/70">
                {tagline || "Source poultry products, reach verified buyers and get practical guidance for better farm decisions—all in one place."}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link className={buttonStyles({ size: "lg" })} href="/marketplace">Browse marketplace <Icon className="size-5" name="arrow" /></Link>
                <Link className={buttonStyles({ variant: "outline", size: "lg" })} href="/seller">Start selling</Link>
              </div>
              <dl className="mt-10 grid max-w-xl grid-cols-3 divide-x divide-coop/15 border-y border-coop/15 py-4">
                <Stat label="Trade" value="Farm-gate" />
                <Stat className="px-4" label="Reach" value="Nationwide" />
                <Stat className="pl-4" label="Support" value="Practical" />
              </dl>
            </div>
            <div className="relative">
              <div className="absolute -left-4 -top-4 z-10 -rotate-2 rounded-control bg-yolk px-4 py-3 text-sm font-black text-coop shadow-label">MARKET READY</div>
              <div className="relative aspect-[16/10] overflow-hidden rounded-panel border-4 border-white bg-coop shadow-crate">
                <ResponsiveImage alt="Chickens feeding inside a working poultry farm" fill priority sizes="(max-width: 1024px) 100vw, 48vw" src="/images/poultry/marketplace-hero.webp" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-coop/90 to-transparent px-5 pb-5 pt-16 text-white">
                  <span><span className="market-label block text-yolk">Farm listings</span><span className="mt-1 block font-display text-lg font-bold">Real stock. Clear quantities.</span></span>
                  <span aria-hidden="true" className="flex gap-1">{[1, 2, 3, 4].map((tick) => <i className="block h-7 w-px bg-white/50" key={tick} />)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="market-label text-sack">Market categories</p><h2 className="mt-3 font-display text-3xl font-black tracking-tight text-coop sm:text-4xl">What are you sourcing today?</h2></div>
            <Link className="inline-flex items-center gap-2 text-sm font-bold text-palm hover:text-coop" href="/categories">View all categories <Icon className="size-4" name="arrow" /></Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{categories.map((category) => <CategoryCard {...category} key={category.name} />)}</div>
        </section>

        <section className="bg-palm px-5 py-14 text-white sm:px-6 lg:px-8 lg:py-18">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
            <Callout body="List available birds, eggs and inputs with clear quantities, delivery terms and location." eyebrow="For poultry businesses" href="/seller" link="Open seller workspace" title="Take your stock beyond the farm gate." />
            <Callout body="Book guidance on flock health, housing, feeding and everyday production decisions." dark eyebrow="For better production" href="/mentors" link="Find a mentor" title="Get practical answers from mentors." />
          </div>
        </section>
      </main>
      <SiteFooter branding={{ companyName, companyShortName: shortName, tagline, email, phone, whatsapp, address, rcNumber, logoDark, socialLinks }} />
    </div>
  );
}

function Stat({ label, value, className = "pr-4" }: { label: string; value: string; className?: string }) {
  return <div className={className}><dt className="text-xs font-bold uppercase tracking-market text-coop/45">{label}</dt><dd className="mt-1 font-display text-lg font-bold text-coop">{value}</dd></div>;
}

function Callout({ eyebrow, title, body, href, link, dark = false }: { eyebrow: string; title: string; body: string; href: string; link: string; dark?: boolean }) {
  return <div className={`rounded-panel border border-white/15 p-7 sm:p-9 ${dark ? "bg-coop/35" : "bg-white/5"}`}><p className="market-label text-yolk">{eyebrow}</p><h2 className="mt-3 font-display text-3xl font-black">{title}</h2><p className="mt-4 max-w-lg text-white/70">{body}</p><Link className={buttonStyles({ variant: dark ? "outline" : "secondary", className: dark ? "mt-6 border-white/30 bg-transparent text-white hover:border-yolk hover:text-yolk" : "mt-6" })} href={href}>{link}</Link></div>;
}
