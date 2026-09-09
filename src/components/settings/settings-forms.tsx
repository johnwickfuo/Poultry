"use client";

import Image from "next/image";
import { useActionState } from "react";

import {
  removeSettingMediaAction,
  updateBrandingAction,
  updateIntegrationsAction,
  updatePlatformRulesAction,
  uploadSettingMediaAction,
} from "@/app/admin/settings/actions";
import { initialSettingsFormState } from "@/app/admin/settings/form-state";
import type { MediaSettingKey } from "@/server/settings/registry";
import { SaveButton, SettingsField, SettingsMessage } from "./settings-controls";

type BrandingValues = {
  company_name: string;
  company_short_name: string;
  company_tagline: string;
  company_email: string;
  company_phone: string;
  company_whatsapp: string;
  company_address: string;
  company_rc_number: string;
  company_social_links: Record<string, string>;
};

export function BrandingSettingsForm({ values }: { values: BrandingValues }) {
  const [state, action, pending] = useActionState(
    updateBrandingAction,
    initialSettingsFormState,
  );

  return (
    <form action={action} className="space-y-6">
      <SettingsMessage state={state} />
      <div className="grid gap-5 md:grid-cols-2">
        <SettingsField errors={state.fieldErrors?.company_name} label="Company name" name="company_name" defaultValue={values.company_name} placeholder="Falls back to APP_NAME when empty" />
        <SettingsField errors={state.fieldErrors?.company_short_name} label="Short name" name="company_short_name" defaultValue={values.company_short_name} />
        <SettingsField errors={state.fieldErrors?.company_tagline} label="Tagline" name="company_tagline" defaultValue={values.company_tagline} />
        <SettingsField errors={state.fieldErrors?.company_email} label="Company email" name="company_email" defaultValue={values.company_email} type="email" />
        <SettingsField errors={state.fieldErrors?.company_phone} label="Phone" name="company_phone" defaultValue={values.company_phone} />
        <SettingsField errors={state.fieldErrors?.company_whatsapp} label="WhatsApp" name="company_whatsapp" defaultValue={values.company_whatsapp} />
        <SettingsField errors={state.fieldErrors?.company_rc_number} label="RC number" name="company_rc_number" defaultValue={values.company_rc_number} />
        <SettingsField errors={state.fieldErrors?.company_address} label="Address" name="company_address" defaultValue={values.company_address} />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-800" htmlFor="company_social_links">
          Social links (JSON)
        </label>
        <p className="mt-1 text-xs text-slate-500">Example: {`{"facebook":"https://facebook.com/example"}`}</p>
        <textarea
          className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 p-3 font-mono text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          defaultValue={JSON.stringify(values.company_social_links, null, 2)}
          id="company_social_links"
          name="company_social_links"
        />
        {state.fieldErrors?.company_social_links?.map((error) => (
          <p className="mt-1 text-xs text-rose-700" key={error}>{error}</p>
        ))}
      </div>
      <SaveButton pending={pending} />
    </form>
  );
}

type RuleValues = {
  marketplace_commission_percent: number;
  consultation_standard_response_hours: number;
  consultation_urgent_response_hours: number;
  buyer_request_expiry_days: number;
  quote_validity_days: number;
  dispute_window_days: number;
  consultation_followup_days: number;
};

const ruleFields: Array<{ key: keyof RuleValues; label: string; suffix: string; step?: string }> = [
  { key: "marketplace_commission_percent", label: "Marketplace commission", suffix: "%", step: "0.01" },
  { key: "consultation_standard_response_hours", label: "Standard consultation response", suffix: "hours" },
  { key: "consultation_urgent_response_hours", label: "Urgent consultation response", suffix: "hours" },
  { key: "buyer_request_expiry_days", label: "Buyer request expiry", suffix: "days" },
  { key: "quote_validity_days", label: "Quote validity", suffix: "days" },
  { key: "dispute_window_days", label: "Dispute window", suffix: "days" },
  { key: "consultation_followup_days", label: "Consultation follow-up", suffix: "days" },
];

export function PlatformRulesForm({ values }: { values: RuleValues }) {
  const [state, action, pending] = useActionState(
    updatePlatformRulesAction,
    initialSettingsFormState,
  );
  return (
    <form action={action} className="space-y-6">
      <SettingsMessage state={state} />
      <div className="grid gap-5 md:grid-cols-2">
        {ruleFields.map(({ key, label, suffix, step }) => (
          <SettingsField
            defaultValue={values[key]}
            description={suffix}
            errors={state.fieldErrors?.[key]}
            key={key}
            label={label}
            min="0"
            name={key}
            step={step ?? "1"}
            type="number"
          />
        ))}
      </div>
      <SaveButton pending={pending} />
    </form>
  );
}

type IntegrationValues = {
  settlement_driver: "escrow";
  active_payment_gateway: "paystack" | "flutterwave";
  payout_mode: "manual_request" | "automatic";
};

export function IntegrationsForm({ values }: { values: IntegrationValues }) {
  const [state, action, pending] = useActionState(
    updateIntegrationsAction,
    initialSettingsFormState,
  );
  return (
    <form action={action} className="space-y-6">
      <SettingsMessage state={state} />
      <div className="grid gap-5 md:grid-cols-3">
        <SelectField label="Settlement driver" name="settlement_driver" defaultValue={values.settlement_driver} options={["escrow"]} />
        <SelectField label="Payment gateway" name="active_payment_gateway" defaultValue={values.active_payment_gateway} options={["paystack", "flutterwave"]} />
        <SelectField label="Payout mode" name="payout_mode" defaultValue={values.payout_mode} options={["manual_request", "automatic"]} />
      </div>
      <SaveButton pending={pending} />
    </form>
  );
}

function SelectField({ label, name, defaultValue, options }: { label: string; name: string; defaultValue: string; options: string[] }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-800" htmlFor={name}>{label}</label>
      <select className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm" defaultValue={defaultValue} id={name} name={name}>
        {options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
      </select>
    </div>
  );
}

export function MediaSettingForm({ settingKey, label, currentPath }: { settingKey: MediaSettingKey; label: string; currentPath: string }) {
  const [state, action, pending] = useActionState(
    uploadSettingMediaAction,
    initialSettingsFormState,
  );
  const isVideo = currentPath.endsWith(".mp4");
  const accept = settingKey === "company_favicon"
    ? "image/png,image/x-icon,.ico"
    : settingKey === "homepage_hero_media"
      ? "image/png,image/jpeg,image/webp,video/mp4"
      : "image/png,image/jpeg,image/webp";

  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900">{label}</h3>
          <p className="mt-1 text-xs text-slate-500">Uploading a new file replaces the current one.</p>
        </div>
        {currentPath && !isVideo ? (
          <Image alt="" className="h-12 w-20 rounded-lg object-contain" height={48} src={currentPath} unoptimized width={80} />
        ) : null}
        {currentPath && isVideo ? <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs">MP4 uploaded</span> : null}
      </div>
      <form action={action} className="mt-4 space-y-3">
        <input name="key" type="hidden" value={settingKey} />
        <input accept={accept} className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-semibold file:text-emerald-800" name="file" required type="file" />
        <SettingsMessage state={state} />
        <SaveButton label={currentPath ? "Replace file" : "Upload file"} pending={pending} />
      </form>
      {currentPath ? (
        <form action={removeSettingMediaAction} className="mt-3">
          <input name="key" type="hidden" value={settingKey} />
          <button className="text-sm font-semibold text-rose-700 hover:text-rose-800" type="submit">Remove current file</button>
        </form>
      ) : null}
    </div>
  );
}
