"use client";

import { useActionState } from "react";

import { Button, FileUpload } from "@/components";
import type { CategoryFormState } from "./form-state";

export function CategoryImageForm({ action }: { action: (state: CategoryFormState, data: FormData) => Promise<CategoryFormState> }) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" } satisfies CategoryFormState);
  return <form action={formAction} className="space-y-4" encType="multipart/form-data"><FileUpload accept="image/png,image/jpeg,image/webp" hint="PNG, JPEG or WebP; 5 MB maximum." label="Replacement image" name="image" required/>{state.message ? <p className={`text-sm ${state.status === "success" ? "text-palm" : "text-red-800"}`} role="status">{state.message}</p> : null}<Button disabled={pending} type="submit" variant="outline">{pending ? "Uploading…" : "Replace image"}</Button></form>;
}
