import { AccountNavigation } from "@/components";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireUser } from "@/server/authorization";

export default async function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const roles = user.roles.map(({ role }) => role.name);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <AccountNavigation roles={roles} />
        <LogoutButton />
      </div>
      <div className="mt-10">{children}</div>
    </main>
  );
}
