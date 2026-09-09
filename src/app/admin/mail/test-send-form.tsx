"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { initialMailTestState, testSendMailAction } from "./actions";

export function TestSendForm({ defaultTemplate, templates }: { defaultTemplate: string; templates: Array<{ key: string; name: string }> }) {
  const [state, action, pending] = useActionState(testSendMailAction, initialMailTestState);
  return <form action={action} className="grid gap-4 rounded-card border border-coop/10 bg-white p-5 shadow-crate sm:grid-cols-[1fr_14rem_auto] sm:items-end"><Input autoComplete="email" label="Test recipient" name="recipient" placeholder="you@example.com" required type="email"/><Select defaultValue={defaultTemplate} label="Template" name="template">{templates.map((template) => <option key={template.key} value={template.key}>{template.name}</option>)}</Select><Button disabled={pending} type="submit">{pending ? "Sending…" : "Send test"}</Button>{state.message ? <p className={`text-sm sm:col-span-3 ${state.status === "success" ? "text-palm" : "text-red-700"}`} role="status">{state.message}</p> : null}</form>;
}
