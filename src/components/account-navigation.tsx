import Link from "next/link";

import { ROLE_NAMES, type RoleName } from "@/server/authorization/roles";

type AccountNavigationProps = {
  roles: readonly string[];
};

const roleLinks: Array<{ href: string; label: string; role: RoleName }> = [
  { href: "/admin", label: "Administration", role: ROLE_NAMES.ADMIN },
  { href: "/seller", label: "Seller workspace", role: ROLE_NAMES.SELLER },
  { href: "/mentor", label: "Mentor workspace", role: ROLE_NAMES.MENTOR },
];

export function AccountNavigation({ roles }: AccountNavigationProps) {
  const assignedRoles = new Set(roles);

  return (
    <nav aria-label="Account navigation" className="flex flex-wrap gap-3">
      <Link className="rounded-lg bg-slate-900 px-4 py-2 text-white" href="/account">
        Account
      </Link>
      {roleLinks
        .filter(({ role }) => assignedRoles.has(role))
        .map(({ href, label }) => (
          <Link
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-800"
            href={href}
            key={href}
          >
            {label}
          </Link>
        ))}
    </nav>
  );
}
