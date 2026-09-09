"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/server/authorization";
import { getSellerApplicationByUser, saveSellerDraft, SellerWorkflowError, submitSellerApplication } from "@/server/services/seller-onboarding";
import { localStorage, storeSellerLogo } from "@/server/storage";
import { sellerBusinessSchema, sellerContactSchema, sellerLocationSchema } from "@/server/validation/seller";

export type SellerFormState = { status: "idle" | "error"; message?: string; fieldErrors?: Record<string, string[] | undefined> };

const stepSchema = z.enum(["business", "contact", "location"]);
const schemas = { business: sellerBusinessSchema, contact: sellerContactSchema, location: sellerLocationSchema };
const nextSteps = { business: "contact", contact: "location", location: "review" } as const;

export async function saveSellerStepAction(_previous: SellerFormState, formData: FormData): Promise<SellerFormState> {
  const user = await requireUser();
  const stepResult = stepSchema.safeParse(formData.get("step"));
  if (!stepResult.success) return { status: "error", message: "Invalid application step." };

  const step = stepResult.data;
  const parsed = schemas[step].safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { status: "error", message: "Correct the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };

  const existing = await getSellerApplicationByUser(user.id);
  const file = formData.get("logo");
  let logoPath: string | undefined;
  try {
    if (step === "business" && file instanceof File && file.size > 0) logoPath = await storeSellerLogo(file, user.id);
    await saveSellerDraft(user.id, { ...parsed.data, ...(logoPath ? { logoPath } : {}) });
  } catch (error) {
    if (logoPath) await localStorage.delete(logoPath).catch(() => undefined);
    return { status: "error", message: error instanceof Error ? error.message : "Unable to save this step." };
  }

  if (logoPath && existing?.logoPath) await localStorage.delete(existing.logoPath).catch(() => undefined);
  revalidatePath("/sell/apply");
  redirect(`/sell/apply?step=${nextSteps[step]}&saved=1`);
}

export async function submitSellerAction(): Promise<void> {
  const user = await requireUser();
  try {
    await submitSellerApplication(user.id);
  } catch (error) {
    const message = error instanceof SellerWorkflowError ? error.message : "Unable to submit the application.";
    redirect(`/sell/apply?step=review&error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/seller");
  redirect("/seller?submitted=1");
}
