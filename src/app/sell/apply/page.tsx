import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandMark } from "@/components/site/brand-mark";
import { Button, Card, StatusBadge, buttonStyles } from "@/components";
import { requireUser } from "@/server/authorization";
import { BrandingService } from "@/server/branding";
import { getSellerApplicationByUser } from "@/server/services/seller-onboarding";
import { submitSellerAction } from "./actions";
import { SellerApplicationForm } from "./application-form";

const steps = ["business", "contact", "location", "review"] as const;
type Step = (typeof steps)[number];

export default async function SellerApplyPage({ searchParams }: { searchParams: Promise<{ step?: string; saved?: string; error?: string }> }) {
  const [user, branding, query] = await Promise.all([requireUser(), BrandingService.getIdentity(), searchParams]);
  const application = await getSellerApplicationByUser(user.id);
  if (application && ["PENDING_REVIEW", "APPROVED", "SUSPENDED"].includes(application.verificationStatus)) redirect("/seller");
  const step: Step = steps.includes(query.step as Step) ? query.step as Step : "business";

  return <main className="min-h-screen bg-eggshell px-4 py-6 sm:px-6 sm:py-10"><div className="mx-auto max-w-4xl"><div className="mb-7 flex items-center justify-between"><BrandMark companyName={branding.companyName} logo={branding.logo} shortName={branding.companyShortName}/><Link className="text-sm font-semibold text-coop/65 hover:text-palm" href="/account">My account</Link></div>
    <div className="grid gap-6 lg:grid-cols-[15rem_1fr]"><aside><p className="market-label text-sack">Seller onboarding</p><h1 className="mt-3 font-display text-3xl font-black text-coop">Set up your farm gate</h1><p className="mt-3 text-sm leading-6 text-coop/65">Save each section as a draft. Submitting sends it to an admin; it does not grant seller access.</p><ol className="mt-6 space-y-2">{steps.map((item, index) => <li key={item}><Link className={`flex items-center gap-3 rounded-control px-3 py-2 text-sm font-semibold capitalize ${item === step ? "bg-coop text-white" : "text-coop/60 hover:bg-white"}`} href={`/sell/apply?step=${item}`}><span className="grid size-6 place-items-center rounded-full bg-yolk text-xs text-coop">{index + 1}</span>{item}</Link></li>)}</ol></aside>
      <Card className="p-5 sm:p-8">{query.saved ? <p className="mb-5 rounded-control bg-palm/10 px-4 py-3 text-sm font-semibold text-palm">Draft saved.</p> : null}{query.error ? <p className="mb-5 rounded-control bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{query.error}</p> : null}
        <div className="mb-6 flex items-center justify-between gap-4"><div><p className="market-label text-sack">Step {steps.indexOf(step) + 1} of 4</p><h2 className="mt-2 font-display text-2xl font-black capitalize text-coop">{step === "review" ? "Review and submit" : `${step} details`}</h2></div><StatusBadge status="draft"/></div>
        {step !== "review" ? <SellerApplicationForm step={step} values={application || { email: user.email }}/>
          : <Review application={application}/>}
      </Card></div></div></main>;
}

function Review({ application }: { application: Awaited<ReturnType<typeof getSellerApplicationByUser>> }) {
  if (!application) return <div><p className="text-coop/65">Start with the business section before submitting.</p><Link className={buttonStyles({ className: "mt-5" })} href="/sell/apply?step=business">Start application</Link></div>;
  const rows = [["Business", application.businessName], ["Type", application.businessType?.replaceAll("_", " ")], ["Phone", application.phone], ["WhatsApp", application.whatsapp || "Not supplied"], ["Email", application.email], ["Location", [application.lga, application.state].filter(Boolean).join(", ")], ["Address", application.address]];
  return <div><dl className="divide-y divide-coop/10 rounded-card border border-coop/10">{rows.map(([label, value]) => <div className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr]" key={label}><dt className="text-sm font-semibold text-coop/55">{label}</dt><dd className="text-sm capitalize text-coop">{value || <span className="text-red-700">Missing</span>}</dd></div>)}</dl><div className="mt-5 rounded-control bg-yolk/20 p-4 text-sm leading-6 text-coop">By submitting, you confirm these details are accurate. An administrator must approve the application before seller tools become available.</div><form action={submitSellerAction} className="mt-5 flex flex-wrap justify-between gap-3"><Link className={buttonStyles({ variant: "outline" })} href="/sell/apply?step=business">Edit details</Link><Button type="submit">Submit for review</Button></form></div>;
}
