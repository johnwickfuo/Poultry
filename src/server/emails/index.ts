import "server-only";

import { prisma } from "@/server/database/prisma";
import { parseServerEnv } from "@/server/validation/env";
import { MailService } from "./mail-service";

async function recipientContext(email: string) {
  return prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, username: true, profile: { select: { displayName: true } } },
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const env = parseServerEnv();
  const url = new URL("/verify-email", env.APP_URL);
  url.searchParams.set("token", token);
  const user = await recipientContext(email);

  return MailService.sendTemplate({
    to: email,
    template: "verification",
    data: {
      actionUrl: url.toString(),
      recipientName: user?.profile?.displayName || user?.username,
    },
    userId: user?.id,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const env = parseServerEnv();
  const url = new URL("/reset-password", env.APP_URL);
  url.searchParams.set("token", token);
  const user = await recipientContext(email);

  return MailService.sendTemplate({
    to: email,
    template: "password_reset",
    data: {
      actionUrl: url.toString(),
      recipientName: user?.profile?.displayName || user?.username,
    },
    userId: user?.id,
  });
}

export { MailDeliveryError, MailService, type MailSendResult } from "./mail-service";
export { renderEmailTemplate } from "./render";
export { EMAIL_TEMPLATE_CATALOG, EMAIL_TEMPLATE_KEYS, sampleTemplateData, type EmailTemplateKey } from "./templates";
