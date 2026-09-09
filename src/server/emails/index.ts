import nodemailer from "nodemailer";

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
