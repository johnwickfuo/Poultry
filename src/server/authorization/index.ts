import type { UserRole } from "@prisma/client";

import { auth } from "@/server/authentication";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function hasRole(allowedRoles: UserRole[]): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user?.role && allowedRoles.includes(user.role));
}
