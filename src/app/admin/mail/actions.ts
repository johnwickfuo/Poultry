"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole, ROLE_NAMES } from "@/server/authorization";
import { MailDeliveryError, MailService } from "@/server/emails";
import { EMAIL_TEMPLATE_KEYS, sampleTemplateData } from "@/server/emails/templates";
import { parseServerEnv } from "@/server/validation/env";

export type MailTestState = { status: "idle" | "success" | "error"; message?: string };
export const initialMailTestState: MailTestState = { status: "idle" };

const testMailSchema = z.object({
  recipient: z.email("Enter a valid recipient email address."),
  template: z.enum(EMAIL_TEMPLATE_KEYS),
});

export async function testSendMailAction(_previous: MailTestState, formData: FormData): Promise<MailTestState> {
  await requireRole(ROLE_NAMES.ADMIN);
  const parsed = testMailSchema.safeParse({ recipient: formData.get("recipient"), template: formData.get("template") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message || "Check the test-send fields." };

  try {
    const env = parseServerEnv();
    const result = await MailService.sendTemplate({
      to: parsed.data.recipient,
      template: parsed.data.template,
      data: sampleTemplateData(parsed.data.template, env.APP_URL),
    });
    revalidatePath("/admin/mail");
    if (result.status === "suppressed") {
      return { status: "error", message: "This recipient is suppressed after a hard bounce; no email was sent." };
    }
    return { status: "success", message: "Test email accepted by the configured mail provider." };
  } catch (error) {
    revalidatePath("/admin/mail");
    return { status: "error", message: error instanceof MailDeliveryError ? "The provider could not accept the test email. Check configuration and delivery logs." : "Unable to prepare the test email." };
  }
}
