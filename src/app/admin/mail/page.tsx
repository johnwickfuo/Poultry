import type { Metadata } from "next";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/feedback";
import { prisma } from "@/server/database/prisma";
import { renderEmailTemplate } from "@/server/emails";
import { EMAIL_TEMPLATE_CATALOG, EMAIL_TEMPLATE_KEYS, sampleTemplateData, type EmailTemplateKey } from "@/server/emails/templates";
import { parseServerEnv } from "@/server/validation/env";
import { TestSendForm } from "./test-send-form";

export const metadata: Metadata = { title: "Mail previews | Administration" };
export const dynamic = "force-dynamic";

export default async function AdminMailPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const requestedTemplate = (await searchParams).template;
  const selected: EmailTemplateKey = EMAIL_TEMPLATE_KEYS.includes(requestedTemplate as EmailTemplateKey) ? requestedTemplate as EmailTemplateKey : "verification";
  const env = parseServerEnv();
  const [preview, deliveries] = await Promise.all([
    renderEmailTemplate(selected, sampleTemplateData(selected, env.APP_URL)),
    prisma.emailDelivery.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
  ]);

  return <div className="space-y-8"><header><p className="market-label text-sack">Delivery desk</p><h1 className="mt-3 text-4xl font-black text-coop">Mail previews</h1><p className="mt-3 max-w-2xl text-coop/65">Review branded authentication emails and send a logged test through the configured {env.MAIL_PROVIDER} adapter.</p></header><TestSendForm defaultTemplate={selected} templates={EMAIL_TEMPLATE_CATALOG}/><div className="grid gap-6 xl:grid-cols-[17rem_1fr]"><nav aria-label="Email templates" className="space-y-2">{EMAIL_TEMPLATE_CATALOG.map((template) => <Link className={`block rounded-card border p-4 transition ${template.key === selected ? "border-palm bg-palm text-white shadow-label" : "border-coop/10 bg-white text-coop hover:border-palm"}`} href={`/admin/mail?template=${template.key}`} key={template.key}><span className="font-semibold">{template.name}</span><span className={`mt-1 block text-xs leading-5 ${template.key === selected ? "text-white/70" : "text-coop/55"}`}>{template.description}</span></Link>)}</nav><section className="overflow-hidden rounded-panel border border-coop/10 bg-white shadow-crate"><div className="border-b border-coop/10 px-5 py-4"><p className="text-xs font-bold uppercase tracking-market text-coop/45">Subject</p><p className="mt-1 font-semibold text-coop">{preview.subject}</p></div><iframe className="h-[720px] w-full bg-eggshell" sandbox="" srcDoc={preview.html} title={`${selected} email preview`}/></section></div><section><div className="flex items-end justify-between gap-4"><div><p className="market-label text-sack">Recent activity</p><h2 className="mt-2 text-2xl font-black text-coop">Delivery log</h2></div><p className="text-xs text-coop/50">Latest 12 attempts</p></div><div className="mt-4 overflow-x-auto rounded-card border border-coop/10 bg-white shadow-crate"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-eggshell text-xs uppercase tracking-market text-coop/55"><tr><th className="px-4 py-3">Recipient</th><th className="px-4 py-3">Template</th><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th></tr></thead><tbody className="divide-y divide-coop/10">{deliveries.map((delivery) => <tr key={delivery.id}><td className="px-4 py-3 font-medium text-coop">{delivery.recipient}</td><td className="px-4 py-3 text-coop/65">{delivery.template.replaceAll("_", " ")}</td><td className="px-4 py-3 capitalize text-coop/65">{delivery.provider}</td><td className="px-4 py-3"><DeliveryStatus status={delivery.status}/>{delivery.failureReason ? <p className="mt-1 max-w-xs text-xs text-coop/50">{delivery.failureReason}</p> : null}</td><td className="px-4 py-3 text-coop/55">{delivery.createdAt.toLocaleString("en-NG")}</td></tr>)}{deliveries.length === 0 ? <tr><td className="px-4 py-8 text-center text-coop/55" colSpan={5}>No delivery attempts have been logged yet.</td></tr> : null}</tbody></table></div></section></div>;
}

function DeliveryStatus({ status }: { status: "QUEUED" | "SENT" | "FAILED" | "SUPPRESSED" }) {
  if (status === "SENT") return <StatusBadge status="success"/>;
  if (status === "QUEUED") return <StatusBadge status="pending"/>;
  if (status === "FAILED") return <StatusBadge status="error"/>;
  return <StatusBadge status="suspended"/>;
}
