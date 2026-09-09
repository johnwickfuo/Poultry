import { z } from "zod";

const email = z
  .preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.email("Enter a valid email address."),
  )
  .transform((value) => value.toLowerCase());

const username = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(32, "Username must be 32 characters or fewer.")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Use only letters, numbers, and underscores.",
  )
  .transform((value) => value.toLowerCase());

const password = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .max(128, "Password must be 128 characters or fewer.")
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/[0-9]/, "Include a number.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(128),
});

export const registerSchema = z
  .object({
    email,
    username,
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const emailSchema = z.object({ email });

export const tokenSchema = z.object({
  token: z.string().length(64, "This link is invalid."),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().length(64, "This link is invalid."),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
