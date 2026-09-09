import type { Prisma } from "@prisma/client";

import { ROLE_NAMES } from "@/server/authorization/roles";
import { prisma } from "@/server/database/prisma";
import { SellerMailHooks } from "@/server/emails/seller-events";
import { completeSellerApplicationSchema, rejectionSchema, type CompleteSellerApplication } from "@/server/validation/seller";

export class SellerWorkflowError extends Error {
  constructor(public code: "NOT_FOUND" | "INVALID_STATE" | "INCOMPLETE", message: string) {
    super(message);
    this.name = "SellerWorkflowError";
  }
}

const applicationInclude = {
  user: { include: { profile: true } },
  approvedBy: { select: { username: true, email: true } },
} satisfies Prisma.SellerProfileInclude;

function mailRecipient(application: Awaited<ReturnType<typeof getSellerApplicationByUser>>) {
  if (!application) throw new SellerWorkflowError("NOT_FOUND", "Seller application not found.");
  return {
    id: application.user.id,
    email: application.user.email,
    name: application.user.profile?.displayName || application.user.username,
    businessName: application.businessName || "your business",
  };
}

export function getSellerApplicationByUser(userId: string) {
  return prisma.sellerProfile.findUnique({ where: { userId }, include: applicationInclude });
}

export function getSellerApplication(id: string) {
  return prisma.sellerProfile.findUnique({ where: { id }, include: applicationInclude });
}

export function listSellerApplications() {
  return prisma.sellerProfile.findMany({ include: applicationInclude, orderBy: [{ verificationStatus: "asc" }, { updatedAt: "desc" }] });
}

export async function saveSellerDraft(userId: string, data: Partial<CompleteSellerApplication> & { logoPath?: string | null }) {
  const current = await prisma.sellerProfile.findUnique({ where: { userId }, select: { verificationStatus: true } });
  if (current && !["DRAFT", "REJECTED"].includes(current.verificationStatus)) {
    throw new SellerWorkflowError("INVALID_STATE", "This application can no longer be edited.");
  }

  return prisma.sellerProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: { ...data, verificationStatus: "DRAFT", rejectionReason: null },
  });
}

export async function submitSellerApplication(userId: string) {
  const application = await getSellerApplicationByUser(userId);
  if (!application) throw new SellerWorkflowError("NOT_FOUND", "Save your application before submitting it.");
  if (!completeSellerApplicationSchema.safeParse(application).success) {
    throw new SellerWorkflowError("INCOMPLETE", "Complete every required application section before submitting.");
  }
  if (!(["DRAFT", "REJECTED"] as const).includes(application.verificationStatus as "DRAFT" | "REJECTED")) {
    throw new SellerWorkflowError("INVALID_STATE", "This application has already been submitted.");
  }

  const submitted = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.sellerProfile.updateMany({
      where: { id: application.id, verificationStatus: { in: ["DRAFT", "REJECTED"] } },
      data: { verificationStatus: "PENDING_REVIEW", rejectionReason: null },
    });
    if (updated.count !== 1) throw new SellerWorkflowError("INVALID_STATE", "This application has already been submitted.");
    const sellerRole = await transaction.role.findUnique({ where: { name: ROLE_NAMES.SELLER }, select: { id: true } });
    if (sellerRole) await transaction.userRole.deleteMany({ where: { userId, roleId: sellerRole.id } });
    return transaction.sellerProfile.findUniqueOrThrow({ where: { id: application.id }, include: applicationInclude });
  });

  await SellerMailHooks.submitted(mailRecipient(submitted)).catch(() => undefined);
  return submitted;
}

async function requireRoleId(transaction: Prisma.TransactionClient) {
  const role = await transaction.role.findUnique({ where: { name: ROLE_NAMES.SELLER }, select: { id: true } });
  if (!role) throw new SellerWorkflowError("NOT_FOUND", "The seller role has not been seeded.");
  return role.id;
}

export async function approveSellerApplication(id: string, adminUserId: string) {
  const approved = await prisma.$transaction(async (transaction) => {
    const application = await transaction.sellerProfile.findUnique({ where: { id } });
    if (!application) throw new SellerWorkflowError("NOT_FOUND", "Seller application not found.");
    if (application.verificationStatus !== "PENDING_REVIEW") throw new SellerWorkflowError("INVALID_STATE", "Only pending applications can be approved.");
    const roleId = await requireRoleId(transaction);
    await transaction.userRole.upsert({ where: { userId_roleId: { userId: application.userId, roleId } }, create: { userId: application.userId, roleId }, update: {} });
    return transaction.sellerProfile.update({ where: { id }, data: { verificationStatus: "APPROVED", approvedAt: new Date(), approvedByUserId: adminUserId, rejectionReason: null }, include: applicationInclude });
  });
  await SellerMailHooks.approved(mailRecipient(approved)).catch(() => undefined);
  return approved;
}

async function revokeSellerRole(transaction: Prisma.TransactionClient, userId: string) {
  const role = await transaction.role.findUnique({ where: { name: ROLE_NAMES.SELLER }, select: { id: true } });
  if (role) await transaction.userRole.deleteMany({ where: { userId, roleId: role.id } });
}

export async function rejectSellerApplication(id: string, reason: string) {
  const parsedReason = rejectionSchema.parse({ reason }).reason;
  const rejected = await prisma.$transaction(async (transaction) => {
    const application = await transaction.sellerProfile.findUnique({ where: { id } });
    if (!application) throw new SellerWorkflowError("NOT_FOUND", "Seller application not found.");
    if (application.verificationStatus !== "PENDING_REVIEW") throw new SellerWorkflowError("INVALID_STATE", "Only pending applications can be rejected.");
    await revokeSellerRole(transaction, application.userId);
    return transaction.sellerProfile.update({ where: { id }, data: { verificationStatus: "REJECTED", rejectionReason: parsedReason, approvedAt: null, approvedByUserId: null }, include: applicationInclude });
  });
  await SellerMailHooks.rejected(mailRecipient(rejected), parsedReason).catch(() => undefined);
  return rejected;
}

export async function suspendSellerApplication(id: string) {
  return prisma.$transaction(async (transaction) => {
    const application = await transaction.sellerProfile.findUnique({ where: { id } });
    if (!application) throw new SellerWorkflowError("NOT_FOUND", "Seller application not found.");
    if (application.verificationStatus !== "APPROVED") throw new SellerWorkflowError("INVALID_STATE", "Only approved sellers can be suspended.");
    await revokeSellerRole(transaction, application.userId);
    return transaction.sellerProfile.update({ where: { id }, data: { verificationStatus: "SUSPENDED" }, include: applicationInclude });
  });
}

export async function restoreSellerApplication(id: string, adminUserId: string) {
  return prisma.$transaction(async (transaction) => {
    const application = await transaction.sellerProfile.findUnique({ where: { id } });
    if (!application) throw new SellerWorkflowError("NOT_FOUND", "Seller application not found.");
    if (application.verificationStatus !== "SUSPENDED") throw new SellerWorkflowError("INVALID_STATE", "Only suspended sellers can be restored.");
    const roleId = await requireRoleId(transaction);
    await transaction.userRole.upsert({ where: { userId_roleId: { userId: application.userId, roleId } }, create: { userId: application.userId, roleId }, update: {} });
    return transaction.sellerProfile.update({ where: { id }, data: { verificationStatus: "APPROVED", approvedByUserId: adminUserId, approvedAt: new Date() }, include: applicationInclude });
  });
}
