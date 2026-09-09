import Link from "next/link";

import { Card, StatusBadge, buttonStyles } from "@/components";
import { canAccessSellerDashboard, requireUser } from "@/server/authorization";

export default async function SellerPage() {
  const user = await requireUser();
  const application = user.sellerProfile;
  if (!application) return <StatusScreen title="Start selling poultry products" description="Create a seller application and save your progress as you complete each section." actionHref="/sell/apply" actionLabel="Start seller application"/>;
  if (application.verificationStatus === "PENDING_REVIEW") return <StatusScreen status="pending" title="Application under review" description="Your details are safely submitted. An administrator must approve your application before seller tools are enabled."/>;
  if (application.verificationStatus === "REJECTED") return <StatusScreen status="error" title="Your application needs changes" description={application.rejectionReason || "Review your application and submit it again."} actionHref="/sell/apply" actionLabel="Update application"/>;
  if (application.verificationStatus === "SUSPENDED") return <StatusScreen status="suspended" title="Seller access suspended" description="Your storefront access is paused. Contact platform support if you need clarification or believe this is an error."/>;
  if (!canAccessSellerDashboard(user)) return <StatusScreen status="warning" title="Seller access is being synchronized" description="Your application is approved, but the seller permission is not currently active. Please contact an administrator."/>;

  const fields = [application.businessName, application.businessType, application.description, application.phone, application.email, application.state, application.lga, application.address, application.logoPath];
  const completion = Math.round(fields.filter(Boolean).length / fields.length * 100);
  return <section><p className="market-label text-sack">Farm-gate commerce</p><div className="mt-3 flex flex-wrap items-center gap-4"><h1 className="font-display text-4xl font-black text-coop">{application.businessName}</h1><StatusBadge status="success"/></div><p className="mt-3 max-w-2xl text-coop/65">Your seller access is active. Build your catalogue and prepare to receive marketplace orders.</p><div className="mt-7 grid gap-5 md:grid-cols-3"><Card className="p-5"><p className="text-sm font-semibold text-coop/55">Onboarding status</p><p className="mt-3 font-display text-2xl font-black text-palm">Approved</p><p className="mt-2 text-sm text-coop/60">Approved seller role active</p></Card><Card className="p-5"><p className="text-sm font-semibold text-coop/55">Profile completion</p><p className="mt-3 font-display text-2xl font-black text-coop">{completion}%</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-coop/10"><span className="block h-full bg-yolk" style={{ width: `${completion}%` }}/></div></Card><Card className="p-5"><p className="text-sm font-semibold text-coop/55">Catalogue</p><p className="mt-3 font-display text-2xl font-black text-coop">Ready to build</p><Link className="mt-3 inline-block text-sm font-bold text-palm" href="/seller/products">Open products →</Link></Card></div><div className="mt-6 flex flex-wrap gap-3"><Link className={buttonStyles()} href="/seller/products">Manage catalogue</Link><Link className={buttonStyles({ variant: "outline" })} href="/seller/orders">View orders</Link></div></section>;
}

function StatusScreen({ title, description, status = "draft", actionHref, actionLabel }: { title: string; description: string; status?: "draft" | "pending" | "error" | "suspended" | "warning"; actionHref?: string; actionLabel?: string }) {
  return <Card className="max-w-3xl p-6 sm:p-8"><div className="flex items-center gap-3"><p className="market-label text-sack">Seller onboarding</p><StatusBadge status={status}/></div><h1 className="mt-4 font-display text-4xl font-black text-coop">{title}</h1><p className="mt-4 max-w-xl whitespace-pre-wrap leading-7 text-coop/65">{description}</p>{actionHref && actionLabel ? <Link className={buttonStyles({ className: "mt-6" })} href={actionHref}>{actionLabel}</Link> : null}</Card>;
}
