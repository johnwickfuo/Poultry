import Link from "next/link";

import { buttonStyles } from "@/components";
import { requireUser } from "@/server/authorization";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <section className="rounded-panel border border-coop/10 bg-white p-6 shadow-crate sm:p-8">
      <p className="market-label text-sack">
        Signed in as {user.username}
      </p>
      <h1 className="mt-3 text-4xl font-black text-coop">Your account</h1>
      <p className="mt-4 text-coop/65">
        Navigation is based on roles loaded from the database on the server.
      </p>
      <Link className={buttonStyles({ className: "mt-6" })} href={user.sellerProfile ? "/seller" : "/sell/apply"}>{user.sellerProfile ? "View seller application" : "Apply to become a seller"}</Link>
    </section>
  );
}
