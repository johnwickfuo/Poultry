import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/server/database/prisma";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createOpaqueToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createEmailVerificationToken(userId: string) {
  const token = createOpaqueToken();

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId } }),
    prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
      },
    }),
  ]);

  return token;
}

export async function createPasswordResetToken(userId: string) {
  const token = createOpaqueToken();

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
    prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    }),
  ]);

  return token;
}
