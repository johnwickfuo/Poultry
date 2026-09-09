import Link from "next/link";

export default function AdminPage() {
  return (
    <section className="rounded-panel border border-coop/10 bg-white p-6 shadow-crate sm:p-8">
      <p className="market-label text-sack">Operations desk</p>
      <h1 className="mt-3 text-4xl font-black text-coop">Administration</h1>
      <p className="mt-3 max-w-xl text-coop/65">Manage platform identity, operating rules and integrations from one protected workspace.</p>
      <div className="mt-6 flex flex-wrap gap-3"><Link className="inline-flex min-h-11 items-center rounded-control bg-palm px-5 font-semibold text-white shadow-label" href="/admin/sellers">Review seller applications</Link><Link className="inline-flex min-h-11 items-center rounded-control border border-coop/15 bg-white px-5 font-semibold text-coop" href="/admin/categories">Manage categories</Link><Link className="inline-flex min-h-11 items-center rounded-control border border-coop/15 bg-white px-5 font-semibold text-coop" href="/admin/settings">Open platform settings</Link><Link className="inline-flex min-h-11 items-center rounded-control border border-coop/15 bg-white px-5 font-semibold text-coop" href="/admin/mail">Preview mail templates</Link></div>
    </section>
  );
}
