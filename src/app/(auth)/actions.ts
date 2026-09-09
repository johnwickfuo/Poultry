"use server";

import { Prisma } from "@prisma/client";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { prisma } from "@/server/database/prisma";
import {
  initiatePasswordReset,
  registerUser,
  resendVerification,
  resetPassword,
  verifyEmail,
} from "@/server/authentication/accounts";
import type { AuthFormState } from "@/server/authentication/form-state";
import { signIn, signOut } from "@/server/authentication";
import { consumeRateLimit } from "@/server/authentication/rate-limit";
import { getRequestIp } from "@/server/authentication/request";
import { mergeRequestGuestCart } from "@/server/cart";
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  tokenSchema,
} from "@/server/validation/auth";

const MINUTE = 60 * 1000;

function fields(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function validationError(error: {
  flatten(): { fieldErrors: Record<string, string[] | undefined> };
}): AuthFormState {
  return {
    status: "error",
    message: "Please correct the highlighted fields.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

function throttled(retryAfterSeconds: number): AuthFormState {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return {
    status: "error",
    message: `Too many requests. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
  };
}

export async function registerAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const ip = await getRequestIp();
  const rateLimit = await consumeRateLimit("register", ip, {
    limit: 3,
    windowMs: 15 * MINUTE,
  });
  if (!rateLimit.allowed) return throttled(rateLimit.retryAfterSeconds);

  const parsed = registerSchema.safeParse(fields(formData));
  if (!parsed.success) return validationError(parsed.error);

  try {
    const conflicts = await prisma.user.findMany({
      where: {
        OR: [{ email: parsed.data.email }, { username: parsed.data.username }],
      },
      select: { email: true, username: true },
    });
    const emailExists = conflicts.some(({ email }) => email === parsed.data.email);
    const usernameExists = conflicts.some(
      ({ username }) => username === parsed.data.username,
    );

    if (emailExists || usernameExists) {
      return {
        status: "error",
        message: "An account already uses these details.",
        fieldErrors: {
          email: emailExists ? ["Email is already registered."] : undefined,
          username: usernameExists ? ["Username is already taken."] : undefined,
        },
      };
    }

    const emailSent = await registerUser(parsed.data);
    return {
      status: "success",
      message: emailSent
        ? "Account created. Check your inbox to verify your email."
        : "Account created, but the email could not be sent. Use resend verification to try again.",
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(",")
        : String(error.meta?.target ?? "");
      return {
        status: "error",
        message: "An account already uses these details.",
        fieldErrors: {
          email: target.includes("email")
            ? ["Email is already registered."]
            : undefined,
          username: target.includes("username")
            ? ["Username is already taken."]
            : undefined,
        },
      };
    }
    return { status: "error", message: "Unable to create your account right now." };
  }
}

export async function loginAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse(fields(formData));
  if (!parsed.success) return validationError(parsed.error);

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/account",
      redirect: false,
    });
    const user = await prisma.user.findFirst({ where: { email: parsed.data.email, status: "ACTIVE", deletedAt: null }, select: { id: true } });
    if (user) await mergeRequestGuestCart(user.id);
    redirect("/account");
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        status: "error",
        message: "Email or password is incorrect, or this account is unavailable.",
      };
    }
    throw error;
  }
}

export async function resendVerificationAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse(fields(formData));
  if (!parsed.success) return validationError(parsed.error);

  const ip = await getRequestIp();
  const [accountLimit, ipLimit] = await Promise.all([
    consumeRateLimit("verification-resend-account", `${ip}:${parsed.data.email}`, {
      limit: 3,
      windowMs: 60 * MINUTE,
    }),
    consumeRateLimit("verification-resend-ip", ip, {
      limit: 10,
      windowMs: 60 * MINUTE,
    }),
  ]);
  const blockedLimit = !accountLimit.allowed ? accountLimit : ipLimit;
  if (!blockedLimit.allowed) return throttled(blockedLimit.retryAfterSeconds);

  try {
    await resendVerification(parsed.data.email);
  } catch {
    // Keep the response identical so account existence is never disclosed.
  }

  return {
    status: "success",
    message: "If the account is awaiting verification, a new link has been sent.",
  };
}

export async function verifyEmailAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = tokenSchema.safeParse(fields(formData));
  if (!parsed.success) return validationError(parsed.error);

  const verified = await verifyEmail(parsed.data.token);
  return verified
    ? { status: "success", message: "Email verified. You can now sign in." }
    : { status: "error", message: "This verification link is invalid or expired." };
}

export async function forgotPasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse(fields(formData));
  if (!parsed.success) return validationError(parsed.error);

  const ip = await getRequestIp();
  const [accountLimit, ipLimit] = await Promise.all([
    consumeRateLimit("password-reset-account", `${ip}:${parsed.data.email}`, {
      limit: 3,
      windowMs: 60 * MINUTE,
    }),
    consumeRateLimit("password-reset-ip", ip, {
      limit: 10,
      windowMs: 60 * MINUTE,
    }),
  ]);
  const blockedLimit = !accountLimit.allowed ? accountLimit : ipLimit;
  if (!blockedLimit.allowed) return throttled(blockedLimit.retryAfterSeconds);

  try {
    await initiatePasswordReset(parsed.data.email);
  } catch {
    // Keep the response identical so account existence is never disclosed.
  }

  return {
    status: "success",
    message: "If an eligible account exists, a password-reset link has been sent.",
  };
}

export async function resetPasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse(fields(formData));
  if (!parsed.success) return validationError(parsed.error);

  const updated = await resetPassword(parsed.data);
  return updated
    ? {
        status: "success",
        message: "Password updated. Other sessions have been signed out.",
      }
    : { status: "error", message: "This password-reset link is invalid or expired." };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
