import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Sign in | Poultry Platform" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full justify-center">
      <AuthCard
        description="Use your verified email address and password to continue."
        eyebrow="Welcome back"
        footer={{ label: "New here?", linkLabel: "Create an account", href: "/register" }}
        title="Sign in"
      >
        <LoginForm />
      </AuthCard>
    </div>
  );
}
