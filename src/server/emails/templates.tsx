import type { ReactElement } from "react";

import { EmailBody, EmailButton, EmailDetailTable, EmailHeading, EmailLayout, type EmailBranding } from "./components";

export const EMAIL_TEMPLATE_KEYS = ["verification", "password_reset"] as const;
export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

export type EmailTemplateData = {
  actionUrl: string;
  recipientName?: string;
};

export type RenderedTemplate = {
  subject: string;
  previewText: string;
  text: string;
  element: ReactElement;
};

export const EMAIL_TEMPLATE_CATALOG: Array<{ key: EmailTemplateKey; name: string; description: string }> = [
  { key: "verification", name: "Email verification", description: "Sent after registration and verification-link resend requests." },
  { key: "password_reset", name: "Password reset", description: "Sent when a user requests a secure password reset link." },
];

export function sampleTemplateData(key: EmailTemplateKey, appUrl: string): EmailTemplateData {
  const path = key === "verification" ? "/verify-email?token=preview-token" : "/reset-password?token=preview-token";
  return { actionUrl: new URL(path, appUrl).toString(), recipientName: "Amina" };
}

export function buildEmailTemplate(key: EmailTemplateKey, data: EmailTemplateData, branding: EmailBranding): RenderedTemplate {
  return key === "verification"
    ? verificationTemplate(data, branding)
    : passwordResetTemplate(data, branding);
}

function verificationTemplate(data: EmailTemplateData, branding: EmailBranding): RenderedTemplate {
  const greeting = data.recipientName ? `Hello ${data.recipientName},` : "Hello,";
  const subject = `Verify your email for ${branding.companyShortName}`;
  const previewText = "Confirm your email address to activate your account.";
  return {
    subject,
    previewText,
    text: `${greeting}\n\n${previewText}\n\n${data.actionUrl}\n\nThis link expires in 24 hours. If you did not create this account, ignore this message.\n\n${branding.companyName}`,
    element: <EmailLayout branding={branding} previewText={previewText}><EmailHeading>Verify your email address</EmailHeading><EmailBody>{greeting}</EmailBody><EmailBody>Confirm your email address to activate your marketplace account and keep it secure.</EmailBody><EmailButton href={data.actionUrl}>Verify email</EmailButton><EmailDetailTable rows={[{ label: "Link validity", value: "24 hours" }, { label: "Requested for", value: "Account verification" }]}/><EmailBody>If you did not create this account, you can safely ignore this email.</EmailBody></EmailLayout>,
  };
}

function passwordResetTemplate(data: EmailTemplateData, branding: EmailBranding): RenderedTemplate {
  const greeting = data.recipientName ? `Hello ${data.recipientName},` : "Hello,";
  const subject = `Reset your ${branding.companyShortName} password`;
  const previewText = "Use your secure link to choose a new password.";
  return {
    subject,
    previewText,
    text: `${greeting}\n\n${previewText}\n\n${data.actionUrl}\n\nThis link expires in 1 hour. If you did not request a reset, ignore this message.\n\n${branding.companyName}`,
    element: <EmailLayout branding={branding} previewText={previewText}><EmailHeading>Reset your password</EmailHeading><EmailBody>{greeting}</EmailBody><EmailBody>We received a request to reset your password. Use the secure button below to choose a new one.</EmailBody><EmailButton href={data.actionUrl}>Choose a new password</EmailButton><EmailDetailTable rows={[{ label: "Link validity", value: "1 hour" }, { label: "Security note", value: "The link can only be used once" }]}/><EmailBody>If you did not request this change, ignore this email. Your current password will remain active.</EmailBody></EmailLayout>,
  };
}
