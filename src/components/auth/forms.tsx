"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  forgotPasswordAction,
  loginAction,
  registerAction,
  resendVerificationAction,
  resetPasswordAction,
  verifyEmailAction,
} from "@/app/(auth)/actions";
import { initialAuthFormState } from "@/server/authentication/form-state";
import { FormField, FormMessage, SubmitButton } from "./form-controls";

export function RegisterForm() {
  const [state, action, pending] = useActionState(
    registerAction,
    initialAuthFormState,
  );

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage message={state.message} status={state.status} />
      <FormField
        autoComplete="username"
        errors={state.fieldErrors?.username}
        label="Username"
        name="username"
        placeholder="your_username"
        required
      />
      <FormField
        autoComplete="email"
        errors={state.fieldErrors?.email}
        label="Email address"
        name="email"
        placeholder="you@example.com"
        required
        type="email"
      />
      <FormField
        autoComplete="new-password"
        errors={state.fieldErrors?.password}
        hint="Use 12+ characters with uppercase, lowercase and a number."
        label="Password"
        name="password"
        required
        type="password"
      />
      <FormField
        autoComplete="new-password"
        errors={state.fieldErrors?.confirmPassword}
        label="Confirm password"
        name="confirmPassword"
        required
        type="password"
      />
      <SubmitButton pending={pending}>Create account</SubmitButton>
    </form>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialAuthFormState);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage message={state.message} status={state.status} />
      <FormField
        autoComplete="email"
        errors={state.fieldErrors?.email}
        label="Email address"
        name="email"
        placeholder="you@example.com"
        required
        type="email"
      />
      <FormField
        autoComplete="current-password"
        errors={state.fieldErrors?.password}
        label="Password"
        name="password"
        required
        type="password"
      />
      <div className="-mt-2 text-right">
        <Link className="text-xs font-semibold text-emerald-700" href="/forgot-password">
          Forgot password?
        </Link>
      </div>
      <SubmitButton pending={pending}>Sign in</SubmitButton>
    </form>
  );
}

export function VerifyEmailForm({ token }: { token?: string }) {
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyEmailAction,
    initialAuthFormState,
  );
  const [resendState, resendAction, resending] = useActionState(
    resendVerificationAction,
    initialAuthFormState,
  );

  return (
    <div className="space-y-7">
      {token ? (
        <form action={verifyAction} className="space-y-4">
          <input name="token" type="hidden" value={token} />
          <FormMessage message={verifyState.message} status={verifyState.status} />
          <SubmitButton pending={verifying}>Verify email</SubmitButton>
        </form>
      ) : (
        <FormMessage status="error" message="Open the verification link from your email, or request a new one below." />
      )}
      <div className="border-t border-slate-200 pt-7">
        <h2 className="font-semibold text-slate-900">Need a new link?</h2>
        <form action={resendAction} className="mt-4 space-y-4" noValidate>
          <FormMessage message={resendState.message} status={resendState.status} />
          <FormField
            autoComplete="email"
            errors={resendState.fieldErrors?.email}
            label="Email address"
            name="email"
            required
            type="email"
          />
          <SubmitButton pending={resending}>Resend verification</SubmitButton>
        </form>
      </div>
    </div>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    forgotPasswordAction,
    initialAuthFormState,
  );

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage message={state.message} status={state.status} />
      <FormField
        autoComplete="email"
        errors={state.fieldErrors?.email}
        label="Email address"
        name="email"
        placeholder="you@example.com"
        required
        type="email"
      />
      <SubmitButton pending={pending}>Send reset link</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token?: string }) {
  const [state, action, pending] = useActionState(
    resetPasswordAction,
    initialAuthFormState,
  );

  if (!token) {
    return (
      <FormMessage status="error" message="This reset link is missing or invalid. Request a new link." />
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <input name="token" type="hidden" value={token} />
      <FormMessage message={state.message} status={state.status} />
      <FormField
        autoComplete="new-password"
        errors={state.fieldErrors?.password}
        hint="Use 12+ characters with uppercase, lowercase and a number."
        label="New password"
        name="password"
        required
        type="password"
      />
      <FormField
        autoComplete="new-password"
        errors={state.fieldErrors?.confirmPassword}
        label="Confirm new password"
        name="confirmPassword"
        required
        type="password"
      />
      <SubmitButton pending={pending}>Update password</SubmitButton>
    </form>
  );
}
