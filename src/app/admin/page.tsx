import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="p-10">
      <h1 className="text-4xl font-semibold">Administration</h1>
      <Link className="mt-6 inline-flex rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white" href="/admin/settings">
        Open platform settings
      </Link>
    </main>
  );
}
