import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="mx-auto flex w-full justify-center">
      <AuthCard
        description="Create one secure account. Marketplace roles are assigned separately after registration."
        eyebrow="Join the platform"
        footer={{ label: "Already registered?", linkLabel: "Sign in", href: "/login" }}
        title="Create your account"
      >
        <RegisterForm />
      </AuthCard>
    </div>
  );
}
