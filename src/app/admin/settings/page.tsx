import type { Metadata } from "next";
import Link from "next/link";

import {
  BrandingSettingsForm,
  IntegrationsForm,
  MediaSettingForm,
  PlatformRulesForm,
} from "@/components/settings/settings-forms";
import { BrandingService } from "@/server/branding";
import { getSetting, getSettings } from "@/server/settings";
import { PLATFORM_SETTING_KEYS } from "@/server/settings/registry";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings | Administration" };

const tabs = [
  { id: "branding", label: "Company & Branding" },
  { id: "rules", label: "Platform Rules" },
  { id: "integrations", label: "Integrations" },
] as const;

type Tab = (typeof tabs)[number]["id"];

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const requestedTab = (await searchParams).tab;
  const activeTab: Tab = tabs.some(({ id }) => id === requestedTab)
    ? (requestedTab as Tab)
    : "branding";
  const [branding, brandingValues, platformRules, homepageMedia, integrations] =
    await Promise.all([
      BrandingService.getIdentity(),
      BrandingService.getEditableSettings(),
      getSettings(PLATFORM_SETTING_KEYS),
      getSetting("homepage_hero_media"),
      getSettings([
        "settlement_driver",
        "active_payment_gateway",
        "payout_mode",
      ] as const),
    ]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
            Administration
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Platform settings
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Manage the live identity, operating rules and integrations for {branding.companyName}.
              </p>
            </div>
            <Link className="text-sm font-semibold text-emerald-300 hover:text-white" href="/admin">
              Back to admin
            </Link>
          </div>
        </div>

        <nav aria-label="Settings sections" className="mt-6 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2">
          {tabs.map((tab) => (
            <Link
              className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-emerald-700 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
              href={`/admin/settings?tab=${tab.id}`}
              key={tab.id}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          {activeTab === "branding" ? (
            <div className="space-y-10">
              <SectionHeading title="Company identity" description="Text is available through BrandingService and updates immediately after saving." />
              <BrandingSettingsForm values={brandingValues} />
              <div className="border-t border-slate-200 pt-8">
                <SectionHeading title="Brand media" description="Files are validated, stored with unique names and safely replaceable." />
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <MediaSettingForm currentPath={branding.logo} label="Primary logo" settingKey="company_logo" />
                  <MediaSettingForm currentPath={branding.logoDark} label="Dark-background logo" settingKey="company_logo_dark" />
                  <MediaSettingForm currentPath={branding.favicon} label="Favicon" settingKey="company_favicon" />
                  <MediaSettingForm currentPath={homepageMedia} label="Homepage hero media" settingKey="homepage_hero_media" />
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "rules" ? (
            <div>
              <SectionHeading title="Platform rules" description="Control marketplace timing, fees, disputes and consultation service levels." />
              <div className="mt-6"><PlatformRulesForm values={platformRules} /></div>
            </div>
          ) : null}

          {activeTab === "integrations" ? (
            <div className="space-y-6">
              <SectionHeading title="Integrations" description="Select active drivers here. API credentials remain protected in server environment variables." />
              <div className="grid gap-3 sm:grid-cols-2">
                <IntegrationStatus label="Paystack" configured={Boolean(process.env.PAYSTACK_SECRET_KEY)} />
                <IntegrationStatus label="Flutterwave" configured={Boolean(process.env.FLUTTERWAVE_SECRET_KEY)} />
              </div>
              <IntegrationsForm values={integrations} />
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function IntegrationStatus({ label, configured }: { label: string; configured: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${configured ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
        {configured ? "Configured" : "Missing credentials"}
      </span>
    </div>
  );
}
