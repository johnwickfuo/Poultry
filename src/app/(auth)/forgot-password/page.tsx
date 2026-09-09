import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Forgot password | Poultry Platform" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex w-full justify-center">
      <AuthCard
        description="Enter your email and we will send a secure, time-limited reset link if your account is eligible."
        eyebrow="Account recovery"
        footer={{ label: "Remembered it?", linkLabel: "Back to sign in", href: "/login" }}
        title="Reset your password"
      >
        <ForgotPasswordForm />
      </AuthCard>
    </div>
  );
}
