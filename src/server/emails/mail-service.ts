import "server-only";

import { prisma } from "@/server/database/prisma";
import { parseServerEnv } from "@/server/validation/env";
import { ResendMailProvider } from "./providers/resend";
import type { MailProvider } from "./providers/types";
import { renderEmailTemplate } from "./render";
import type { EmailTemplateData, EmailTemplateKey } from "./templates";

export class MailDeliveryError extends Error {
  constructor(message = "Email delivery failed.") {
    super(message);
    this.name = "MailDeliveryError";
  }
}

function getProvider(): { provider: MailProvider; from: string } {
  const env = parseServerEnv();
  if (!env.MAIL_FROM) throw new Error("MAIL_FROM is not configured.");

  switch (env.MAIL_PROVIDER) {
    case "resend":
      if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured.");
      return { provider: new ResendMailProvider(env.RESEND_API_KEY), from: env.MAIL_FROM };
  }
}

function safeFailureReason(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown provider error.";
  return message.replace(/Bearer\s+\S+/gi, "Bearer [redacted]").slice(0, 1000);
}

export type MailSendResult = {
  deliveryId: string;
  status: "sent" | "suppressed";
  providerMessageId?: string;
};

export class MailService {
  static async sendTemplate({ to, template, data, userId }: { to: string; template: EmailTemplateKey; data: EmailTemplateData; userId?: string }): Promise<MailSendResult> {
    const recipient = to.trim().toLowerCase();
    const [rendered, user] = await Promise.all([
      renderEmailTemplate(template, data),
      userId
        ? prisma.user.findUnique({ where: { id: userId }, select: { id: true, emailHardBouncedAt: true, emailSuppressedAt: true, emailSuppressionReason: true } })
        : prisma.user.findUnique({ where: { email: recipient }, select: { id: true, emailHardBouncedAt: true, emailSuppressedAt: true, emailSuppressionReason: true } }),
    ]);
    const providerName = parseServerEnv().MAIL_PROVIDER;
    const suppressed = Boolean(user?.emailHardBouncedAt || user?.emailSuppressedAt);

    const delivery = await prisma.emailDelivery.create({
      data: {
        userId: user?.id,
        recipient,
        template,
        provider: providerName,
        subject: rendered.subject,
        status: suppressed ? "SUPPRESSED" : "QUEUED",
        failureReason: suppressed ? user?.emailSuppressionReason || "Recipient is suppressed after a hard bounce." : null,
      },
    });

    if (suppressed) return { deliveryId: delivery.id, status: "suppressed" };

    try {
      const { provider, from } = getProvider();
      const result = await provider.send({
        from,
        to: recipient,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        idempotencyKey: `delivery-${delivery.id}`,
      });
      await prisma.emailDelivery.update({
        where: { id: delivery.id },
        data: { status: "SENT", sentAt: new Date(), providerMessageId: result.messageId },
      });
      return { deliveryId: delivery.id, status: "sent", providerMessageId: result.messageId };
    } catch (error) {
      await prisma.emailDelivery.update({ where: { id: delivery.id }, data: { status: "FAILED", failureReason: safeFailureReason(error) } }).catch(() => undefined);
      throw new MailDeliveryError();
    }
  }

  static async suppressUserAfterHardBounce(userId: string, reason = "Hard bounce reported by mail provider.") {
    const now = new Date();
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailHardBouncedAt: now,
        emailSuppressedAt: now,
        emailSuppressionReason: reason.slice(0, 500),
      },
    });
  }
}
