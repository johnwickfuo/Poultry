import type { ReactElement } from "react";

import { EmailBody, EmailButton, EmailDetailTable, EmailHeading, EmailLayout, type EmailBranding } from "./components";

export const EMAIL_TEMPLATE_KEYS = ["verification", "password_reset", "seller_application_submitted", "seller_application_approved", "seller_application_rejected"] as const;
export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

export type EmailTemplateData = {
  actionUrl: string;
  recipientName?: string;
  businessName?: string;
  rejectionReason?: string;
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
  { key: "seller_application_submitted", name: "Seller application submitted", description: "Confirms that a seller application is waiting for admin review." },
  { key: "seller_application_approved", name: "Seller application approved", description: "Welcomes an approved seller to their workspace." },
  { key: "seller_application_rejected", name: "Seller application rejected", description: "Explains why an application needs changes before resubmission." },
];

export function sampleTemplateData(key: EmailTemplateKey, appUrl: string): EmailTemplateData {
  const path = key === "verification" ? "/verify-email?token=preview-token" : key === "password_reset" ? "/reset-password?token=preview-token" : "/seller";
  return { actionUrl: new URL(path, appUrl).toString(), recipientName: "Amina", businessName: "Amina Farms", rejectionReason: "Please provide a more complete operating address before resubmitting." };
}

export function buildEmailTemplate(key: EmailTemplateKey, data: EmailTemplateData, branding: EmailBranding): RenderedTemplate {
  switch (key) {
    case "verification": return verificationTemplate(data, branding);
    case "password_reset": return passwordResetTemplate(data, branding);
    case "seller_application_submitted": return sellerSubmittedTemplate(data, branding);
    case "seller_application_approved": return sellerApprovedTemplate(data, branding);
    case "seller_application_rejected": return sellerRejectedTemplate(data, branding);
  }
}

function sellerSubmittedTemplate(data: EmailTemplateData, branding: EmailBranding): RenderedTemplate {
  const subject = `${data.businessName || "Seller"} application received`;
  const previewText = "Your seller application is now waiting for review.";
  return sellerStatusTemplate(data, branding, { subject, previewText, heading: "Application received", body: "Your seller application has been submitted for admin review. Seller access is only enabled after approval.", cta: "Track application", rows: [{ label: "Business", value: data.businessName || "Seller application" }, { label: "Status", value: "Pending review" }] });
}

function sellerApprovedTemplate(data: EmailTemplateData, branding: EmailBranding): RenderedTemplate {
  const subject = `${data.businessName || "Your seller application"} is approved`;
  const previewText = `You can now use the ${branding.companyShortName} seller workspace.`;
  return sellerStatusTemplate(data, branding, { subject, previewText, heading: "You are approved to sell", body: "Your application has been approved and the seller role is now active on your existing account.", cta: "Open seller workspace", rows: [{ label: "Business", value: data.businessName || "Seller application" }, { label: "Status", value: "Approved" }] });
}

function sellerRejectedTemplate(data: EmailTemplateData, branding: EmailBranding): RenderedTemplate {
  const subject = `${data.businessName || "Your seller application"} needs changes`;
  const previewText = "Review the admin feedback and update your application.";
  return sellerStatusTemplate(data, branding, { subject, previewText, heading: "Application needs changes", body: "Your seller application was not approved this time. You can update it and submit it again.", cta: "Update application", rows: [{ label: "Business", value: data.businessName || "Seller application" }, { label: "Admin feedback", value: data.rejectionReason || "Please review your application details." }] });
}

function sellerStatusTemplate(data: EmailTemplateData, branding: EmailBranding, content: { subject: string; previewText: string; heading: string; body: string; cta: string; rows: Array<{ label: string; value: string }> }): RenderedTemplate {
  const greeting = data.recipientName ? `Hello ${data.recipientName},` : "Hello,";
  return {
    subject: content.subject,
    previewText: content.previewText,
    text: `${greeting}\n\n${content.body}\n\n${content.rows.map((row) => `${row.label}: ${row.value}`).join("\n")}\n\n${data.actionUrl}\n\n${branding.companyName}`,
    element: <EmailLayout branding={branding} previewText={content.previewText}><EmailHeading>{content.heading}</EmailHeading><EmailBody>{greeting}</EmailBody><EmailBody>{content.body}</EmailBody><EmailDetailTable rows={content.rows}/><EmailButton href={data.actionUrl}>{content.cta}</EmailButton></EmailLayout>,
  };
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
