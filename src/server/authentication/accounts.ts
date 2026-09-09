import { hash } from "bcryptjs";

import { prisma } from "@/server/database/prisma";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/server/emails";
import type {
  RegisterInput,
  ResetPasswordInput,
} from "@/server/validation/auth";
import {
  createEmailVerificationToken,
  createPasswordResetToken,
  hashToken,
} from "./tokens";

export async function registerUser(input: RegisterInput) {
  const passwordHash = await hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      passwordHash,
      status: "PENDING",
    },
    select: { id: true, email: true },
  });
  const token = await createEmailVerificationToken(user.id);

  try {
    await sendVerificationEmail(user.email, token);
    return true;
  } catch {
    return false;
  }
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findFirst({
    where: { email, status: "PENDING", deletedAt: null },
    select: { id: true, email: true },
  });

  if (!user) return;

  const token = await createEmailVerificationToken(user.id);
  await sendVerificationEmail(user.email, token);
}

export async function verifyEmail(token: string): Promise<boolean> {
  const tokenHash = hashToken(token);

  return prisma.$transaction(async (tx) => {
    const record = await tx.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.expiresAt <= new Date() || record.user.deletedAt) {
      if (record) {
        await tx.emailVerificationToken.delete({ where: { id: record.id } });
      }
      return false;
    }

    await tx.user.update({
      where: { id: record.userId },
      data: {
        emailVerifiedAt: new Date(),
        status: record.user.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
      },
    });
    await tx.emailVerificationToken.deleteMany({
      where: { userId: record.userId },
    });
    return true;
  });
}

export async function initiatePasswordReset(email: string) {
  const user = await prisma.user.findFirst({
    where: { email, status: "ACTIVE", deletedAt: null },
    select: { id: true, email: true },
  });

  if (!user) return;

  const token = await createPasswordResetToken(user.id);
  await sendPasswordResetEmail(user.email, token);
}

export async function resetPassword(
  input: ResetPasswordInput,
): Promise<boolean> {
  const tokenHash = hashToken(input.token);
  const passwordHash = await hash(input.password, 12);

  return prisma.$transaction(async (tx) => {
    const record = await tx.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !record ||
      record.expiresAt <= new Date() ||
      record.user.status !== "ACTIVE" ||
      record.user.deletedAt
    ) {
      if (record) {
        await tx.passwordResetToken.delete({ where: { id: record.id } });
      }
      return false;
    }

    await tx.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        sessionVersion: { increment: 1 },
      },
    });
    await tx.passwordResetToken.deleteMany({
      where: { userId: record.userId },
    });
    return true;
  });
}

export async function revokeUserSessions(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });
}
