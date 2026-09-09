import Link from "next/link";

export default function AdminPage() {
  return (
    <section className="rounded-panel border border-coop/10 bg-white p-6 shadow-crate sm:p-8">
      <p className="market-label text-sack">Operations desk</p>
      <h1 className="mt-3 text-4xl font-black text-coop">Administration</h1>
      <p className="mt-3 max-w-xl text-coop/65">Manage platform identity, operating rules and integrations from one protected workspace.</p>
      <Link className="mt-6 inline-flex min-h-11 items-center rounded-control bg-palm px-5 font-semibold text-white shadow-label" href="/admin/settings">
        Open platform settings
      </Link>
    </section>
  );
}
