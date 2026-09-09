import { requireApprovedSeller } from "@/server/authorization";

export default async function ApprovedSellerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireApprovedSeller();
  return children;
}
