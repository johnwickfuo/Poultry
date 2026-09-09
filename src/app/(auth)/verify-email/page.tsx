import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { VerifyEmailForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Verify email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="mx-auto flex w-full justify-center">
      <AuthCard
        description="Confirm your address to activate your account and keep it secure."
        eyebrow="Almost there"
        footer={{ label: "Already verified?", linkLabel: "Sign in", href: "/login" }}
        title="Verify your email"
      >
        <VerifyEmailForm token={token} />
      </AuthCard>
    </div>
  );
}
