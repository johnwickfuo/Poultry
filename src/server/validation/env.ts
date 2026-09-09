import { z } from "zod";

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.url().optional(),
);

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

export const serverEnvSchema = z.object({
  APP_NAME: z.string().trim().min(1).default("Poultry Platform"),
  DATABASE_URL: z.string().startsWith("mysql://"),
  AUTH_SECRET: z.string().min(32),
  APP_URL: z.url(),
  MAIL_HOST: optionalString,
  MAIL_PORT: z.coerce.number().int().positive().default(587),
  MAIL_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  MAIL_USER: optionalString,
  MAIL_PASSWORD: optionalString,
  MAIL_FROM: optionalString,
  PAYSTACK_PUBLIC_KEY: optionalString,
  PAYSTACK_SECRET_KEY: optionalString,
  FLUTTERWAVE_PUBLIC_KEY: optionalString,
  FLUTTERWAVE_SECRET_KEY: optionalString,
  GEMINI_API_KEY: optionalString,
  REDIS_URL: optionalUrl,
  STORAGE_ROOT: optionalString,
  SUPER_ADMIN_NAME: optionalString,
  SUPER_ADMIN_EMAIL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.email().optional(),
  ),
  SUPER_ADMIN_USERNAME: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(3).max(32).regex(/^[a-z0-9_]+$/).optional(),
  ),
  SUPER_ADMIN_PASSWORD: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(12).optional(),
  ),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  values: Record<string, string | undefined> = process.env,
): ServerEnv {
  return serverEnvSchema.parse(values);
}
