import Link from "next/link";

import { Card, EmptyState, StatusBadge } from "@/components";
import { listSellerApplications } from "@/server/services/seller-onboarding";

const badgeStatus = { DRAFT: "draft", PENDING_REVIEW: "pending", APPROVED: "success", REJECTED: "error", SUSPENDED: "suspended" } as const;

export default async function SellerApplicationsPage() {
  const applications = await listSellerApplications();
  const pending = applications.filter((application) => application.verificationStatus === "PENDING_REVIEW").length;
  return <section><p className="market-label text-sack">Marketplace trust</p><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-4xl font-black text-coop">Seller applications</h1><p className="mt-2 text-coop/65">Review applications and control access to seller tools.</p></div><span className="rounded-control bg-yolk/25 px-4 py-2 text-sm font-bold text-coop">{pending} pending review</span></div>
    {applications.length ? <div className="mt-7 grid gap-4">{applications.map((application) => <Link href={`/admin/sellers/${application.id}`} key={application.id}><Card className="grid gap-4 p-5 transition hover:border-palm/40 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-3"><h2 className="font-display text-xl font-bold text-coop">{application.businessName || "Incomplete draft"}</h2><StatusBadge status={badgeStatus[application.verificationStatus]}/></div><p className="mt-2 text-sm text-coop/60">{application.user.email} · {[application.lga, application.state].filter(Boolean).join(", ") || "Location incomplete"}</p></div><p className="text-sm font-semibold text-palm">Inspect application →</p></Card></Link>)}</div> : <div className="mt-7"><EmptyState description="Applications will appear here after users begin seller onboarding." title="No seller applications yet"/></div>}
  </section>;
}
