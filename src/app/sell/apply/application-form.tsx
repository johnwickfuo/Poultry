"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FileUpload, Input, Select, Textarea } from "@/components/ui/form";
import { saveSellerStepAction, type SellerFormState } from "./actions";

type Values = {
  businessName?: string | null; businessType?: string | null; description?: string | null; logoPath?: string | null;
  phone?: string | null; whatsapp?: string | null; email?: string | null;
  state?: string | null; lga?: string | null; address?: string | null;
};

const businessTypes = [
  ["individual_farmer", "Individual farmer"], ["registered_business", "Registered business"],
  ["hatchery", "Hatchery"], ["distributor", "Distributor"], ["cooperative", "Cooperative"],
] as const;

export function SellerApplicationForm({ step, values }: { step: "business" | "contact" | "location"; values: Values }) {
  const initialState: SellerFormState = { status: "idle" };
  const [state, action, pending] = useActionState(saveSellerStepAction, initialState);
  const error = (name: string) => state.fieldErrors?.[name]?.[0];

  return <form action={action} className="space-y-5" encType="multipart/form-data">
    <input name="step" type="hidden" value={step}/>
    {step === "business" ? <>
      <Input defaultValue={values.businessName || ""} error={error("businessName")} label="Business name" name="businessName" required/>
      <Select defaultValue={values.businessType || ""} error={error("businessType")} label="Business type" name="businessType" required><option disabled value="">Select one</option>{businessTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
      <Textarea defaultValue={values.description || ""} error={error("description")} hint="Describe what you produce or sell and who you serve." label="Business description" maxLength={1200} name="description" required/>
      <FileUpload accept="image/png,image/jpeg,image/webp" hint={values.logoPath ? "Upload a new image only if you want to replace the current logo. PNG, JPEG or WebP; 5 MB maximum." : "Optional. PNG, JPEG or WebP; 5 MB maximum."} label="Business logo" name="logo"/>
    </> : null}
    {step === "contact" ? <>
      <Input defaultValue={values.phone || ""} error={error("phone")} label="Business phone" name="phone" required type="tel"/>
      <Input defaultValue={values.whatsapp || ""} error={error("whatsapp")} hint="Optional if different from the business phone." label="WhatsApp" name="whatsapp" type="tel"/>
      <Input defaultValue={values.email || ""} error={error("email")} label="Business email" name="email" required type="email"/>
    </> : null}
    {step === "location" ? <>
      <Input defaultValue={values.state || ""} error={error("state")} label="State" name="state" required/>
      <Input defaultValue={values.lga || ""} error={error("lga")} label="Local government area" name="lga" required/>
      <Textarea defaultValue={values.address || ""} error={error("address")} label="Operating address" maxLength={300} name="address" required/>
    </> : null}
    {state.message ? <p className="rounded-control bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{state.message}</p> : null}
    <div className="flex flex-wrap items-center justify-between gap-3"><Link className="text-sm font-semibold text-coop/65 hover:text-palm" href="/account">Save and leave</Link><Button disabled={pending} type="submit">{pending ? "Saving…" : "Save and continue"}</Button></div>
  </form>;
}
