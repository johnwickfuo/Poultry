import { notFound } from "next/navigation";

import { Button, Card, ResponsiveImage, StatusBadge } from "@/components";
import { getSellerApplication } from "@/server/services/seller-onboarding";
import { approveSellerAction, rejectSellerAction, restoreSellerAction, suspendSellerAction } from "../actions";

const badgeStatus = { DRAFT: "draft", PENDING_REVIEW: "pending", APPROVED: "success", REJECTED: "error", SUSPENDED: "suspended" } as const;

export default async function SellerApplicationDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string; error?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const application = await getSellerApplication(id);
  if (!application) notFound();
  const details = [["Applicant", application.user.profile?.fullName || application.user.username], ["Account email", application.user.email], ["Business type", application.businessType?.replaceAll("_", " ")], ["Description", application.description], ["Phone", application.phone], ["WhatsApp", application.whatsapp || "Not supplied"], ["Business email", application.email], ["State", application.state], ["LGA", application.lga], ["Address", application.address], ["Approved by", application.approvedBy?.email || "Not approved"]];
  return <section><p className="market-label text-sack">Seller review</p><div className="mt-3 flex flex-wrap items-center gap-4"><h1 className="font-display text-4xl font-black text-coop">{application.businessName || "Incomplete application"}</h1><StatusBadge status={badgeStatus[application.verificationStatus]}/></div>
    {query.message ? <p className="mt-5 rounded-control bg-palm/10 px-4 py-3 text-sm font-semibold text-palm">{query.message}</p> : null}{query.error ? <p className="mt-5 rounded-control bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{query.error}</p> : null}
    <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_20rem]"><Card className="overflow-hidden"><dl className="divide-y divide-coop/10">{details.map(([label, value]) => <div className="grid gap-2 px-5 py-4 sm:grid-cols-[10rem_1fr]" key={label}><dt className="text-sm font-semibold text-coop/55">{label}</dt><dd className="whitespace-pre-wrap text-sm capitalize text-coop">{value || <span className="text-red-700">Not supplied</span>}</dd></div>)}</dl></Card><div className="space-y-5">{application.logoPath ? <Card className="p-4"><div className="relative aspect-square overflow-hidden rounded-control bg-eggshell"><ResponsiveImage alt={`${application.businessName || "Business"} logo`} fill src={application.logoPath}/></div></Card> : null}<AdminControls application={application}/></div></div>
  </section>;
}

function AdminControls({ application }: { application: NonNullable<Awaited<ReturnType<typeof getSellerApplication>>> }) {
  if (application.verificationStatus === "PENDING_REVIEW") return <Card className="p-5"><h2 className="font-display text-xl font-bold text-coop">Review decision</h2><form action={approveSellerAction.bind(null, application.id)} className="mt-4"><Button className="w-full" type="submit">Approve and grant seller role</Button></form><form action={rejectSellerAction.bind(null, application.id)} className="mt-5 space-y-3"><label className="block text-sm font-semibold text-coop" htmlFor="reason">Rejection reason</label><textarea className="min-h-28 w-full rounded-control border border-coop/20 p-3 text-sm outline-none focus:border-palm" id="reason" maxLength={1000} minLength={10} name="reason" required/><Button className="w-full" type="submit" variant="danger">Reject application</Button></form></Card>;
  if (application.verificationStatus === "APPROVED") return <Card className="p-5"><h2 className="font-display text-xl font-bold text-coop">Seller access</h2><p className="mt-2 text-sm leading-6 text-coop/65">Suspension immediately removes the seller role and blocks protected seller routes.</p><form action={suspendSellerAction.bind(null, application.id)} className="mt-4"><Button className="w-full" type="submit" variant="danger">Suspend seller</Button></form></Card>;
  if (application.verificationStatus === "SUSPENDED") return <Card className="p-5"><h2 className="font-display text-xl font-bold text-coop">Restore access</h2><p className="mt-2 text-sm leading-6 text-coop/65">Restoring reassigns the existing seller role.</p><form action={restoreSellerAction.bind(null, application.id)} className="mt-4"><Button className="w-full" type="submit">Restore seller</Button></form></Card>;
  if (application.verificationStatus === "REJECTED") return <Card className="p-5"><h2 className="font-display text-xl font-bold text-coop">Rejection reason</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-red-800">{application.rejectionReason}</p></Card>;
  return <Card className="p-5 text-sm leading-6 text-coop/65">This user is still preparing their draft. Admin decisions become available after submission.</Card>;
}
