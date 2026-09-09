import { requireRole, ROLE_NAMES } from "@/server/authorization";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireRole(ROLE_NAMES.ADMIN);
  return children;
}
