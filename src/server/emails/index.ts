import nodemailer from "nodemailer";

import { BrandingService } from "@/server/branding";
import { parseServerEnv } from "@/server/validation/env";

export function createMailTransport() {
  const env = parseServerEnv();

  if (!env.MAIL_HOST || !env.MAIL_USER || !env.MAIL_PASSWORD) {
    throw new Error("Mail provider variables are not configured.");
  }

  return nodemailer.createTransport({
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    secure: env.MAIL_SECURE,
    auth: { user: env.MAIL_USER, pass: env.MAIL_PASSWORD },
  });
}

async function sendAuthEmail(options: {
  to: string;
  subject: string;
  heading: string;
  message: string;
  buttonLabel: string;
  url: string;
}) {
  const env = parseServerEnv();
  const transport = createMailTransport();
  const branding = await BrandingService.getIdentity();

  if (!env.MAIL_FROM) throw new Error("MAIL_FROM is not configured.");

  await transport.sendMail({
    from: env.MAIL_FROM,
    to: options.to,
    subject: options.subject,
    text: `${options.message}\n\n${options.url}`,
    html: `
      <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a">
        <div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;padding:32px">
          <h1 style="font-size:24px;margin:0 0 16px">${options.heading}</h1>
          <p style="line-height:1.6;color:#475569">${options.message}</p>
          <a href="${options.url}" style="display:inline-block;margin-top:16px;background:#047857;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600">${options.buttonLabel}</a>
          <p style="margin-top:24px;font-size:12px;color:#64748b">If you did not request this, you can safely ignore this email.</p>
          <p style="margin-top:12px;font-size:12px;color:#94a3b8">${branding.companyName}</p>
        </div>
      </div>`,
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const env = parseServerEnv();
  const url = new URL("/verify-email", env.APP_URL);
  url.searchParams.set("token", token);

  await sendAuthEmail({
    to: email,
    subject: "Verify your email address",
    heading: "Verify your email",
    message: "Confirm your email address to activate your account.",
    buttonLabel: "Verify email",
    url: url.toString(),
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const env = parseServerEnv();
  const url = new URL("/reset-password", env.APP_URL);
  url.searchParams.set("token", token);

  await sendAuthEmail({
    to: email,
    subject: "Reset your password",
    heading: "Reset your password",
    message: "Use this secure link within one hour to choose a new password.",
    buttonLabel: "Reset password",
    url: url.toString(),
  });
}
