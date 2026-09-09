import { redirect } from "next/navigation";

import { auth } from "@/server/authentication";
import { prisma } from "@/server/database/prisma";
import type { RoleName } from "@/server/authorization/roles";

const userWithRoles = {
  profile: true,
  roles: { include: { role: true } },
} as const;

export async function getCurrentUser() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: { id: userId, status: "ACTIVE", deletedAt: null },
    include: userWithRoles,
  });
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) redirect("/api/auth/signin");

  return user;
}

export async function hasRole(role: RoleName): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user?.roles.some((assignment) => assignment.role.name === role));
}

export async function hasAnyRole(roles: readonly RoleName[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const assignedRoles = new Set(
    user.roles.map((assignment) => assignment.role.name),
  );
  return roles.some((role) => assignedRoles.has(role));
}

export async function requireRole(role: RoleName) {
  const user = await requireUser();

  if (!user.roles.some((assignment) => assignment.role.name === role)) {
    redirect("/account");
  }

  return user;
}

export async function requireAnyRole(roles: readonly RoleName[]) {
  const user = await requireUser();
  const assignedRoles = new Set(
    user.roles.map((assignment) => assignment.role.name),
  );

  if (!roles.some((role) => assignedRoles.has(role))) redirect("/account");

  return user;
}

export { ROLE_NAMES, type RoleName } from "@/server/authorization/roles";
