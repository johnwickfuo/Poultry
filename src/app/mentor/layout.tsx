import { requireRole, ROLE_NAMES } from "@/server/authorization";

export default async function MentorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireRole(ROLE_NAMES.MENTOR);
  return children;
}
