import { requireRole, ROLE_NAMES } from "@/server/authorization";

export default async function SellerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireRole(ROLE_NAMES.SELLER);
  return children;
}
