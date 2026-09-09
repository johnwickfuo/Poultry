import { requireUser } from "@/server/authorization";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <section>
      <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
        Signed in as {user.username}
      </p>
      <h1 className="mt-3 text-4xl font-semibold text-slate-950">Your account</h1>
      <p className="mt-4 text-slate-600">
        Navigation is based on roles loaded from the database on the server.
      </p>
    </section>
  );
}
