import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Choose password | Poultry Platform" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="mx-auto flex w-full justify-center">
      <AuthCard
        description="Choose a strong new password. Completing this step signs out your other sessions."
        eyebrow="Secure recovery"
        footer={{ label: "Ready to continue?", linkLabel: "Back to sign in", href: "/login" }}
        title="Choose a new password"
      >
        <ResetPasswordForm token={token} />
      </AuthCard>
    </div>
  );
}
