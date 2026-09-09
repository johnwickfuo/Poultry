"use client";

import { useActionState } from "react";

import { Button, Checkbox, Input, Select, Textarea } from "@/components";
import type { CategoryFormState } from "./form-state";

type Values = { name?: string; slug?: string; description?: string | null; icon?: string | null; parentId?: string | null; sortOrder?: number; isActive?: boolean };

export function CategoryForm({ action, values = {}, parents, submitLabel }: { action: (state: CategoryFormState, data: FormData) => Promise<CategoryFormState>; values?: Values; parents: Array<{ id: string; name: string }>; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" } satisfies CategoryFormState);
  const error = (field: string) => state.fieldErrors?.[field]?.[0];
  return <form action={formAction} className="space-y-5"><Input defaultValue={values.name} error={error("name")} label="Name" name="name" required/><Input defaultValue={values.slug} error={error("slug")} hint="Lowercase words separated by hyphens; used in the public URL." label="SEO slug" name="slug" required/><Textarea defaultValue={values.description || ""} error={error("description")} label="Description" maxLength={1000} name="description"/><div className="grid gap-5 sm:grid-cols-2"><Select defaultValue={values.parentId || ""} error={error("parentId")} label="Parent category" name="parentId"><option value="">Top-level category</option>{parents.map((parent) => <option key={parent.id} value={parent.id}>{parent.name}</option>)}</Select><Input defaultValue={values.icon || ""} error={error("icon")} hint="Internal icon key; optional." label="Icon" name="icon"/></div><Input defaultValue={values.sortOrder ?? 0} error={error("sortOrder")} label="Sort order" min={0} name="sortOrder" required type="number"/><Checkbox defaultChecked={values.isActive ?? true} label="Active and visible in the public marketplace" name="isActive"/>{state.message ? <p className={`rounded-control px-4 py-3 text-sm ${state.status === "success" ? "bg-palm/10 text-palm" : "bg-red-50 text-red-800"}`} role="status">{state.message}</p> : null}<Button disabled={pending} type="submit">{pending ? "Saving…" : submitLabel}</Button></form>;
}
