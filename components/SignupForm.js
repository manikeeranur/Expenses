"use client";

import { useActionState } from "react";
import Link from "next/link";
import Screen from "@/components/Screen";
import TextField from "@/components/ui/TextField";
import SocialButtons from "@/components/ui/SocialButtons";
import { signup } from "@/lib/actions/auth";

export default function SignupForm({ googleEnabled }) {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <Screen withNav={false} className="flex min-h-dvh flex-col px-6 pb-10 pt-14">
      <h1 className="text-2xl font-bold">Create Account</h1>
      <p className="mt-1 text-sm text-muted">Sign up to get started</p>

      <form action={action} className="mt-8 space-y-4">
        <TextField label="Full Name" name="name" placeholder="Isak K" required />
        <TextField label="Email Address" type="email" name="email" placeholder="isak@example.com" required />
        <TextField label="Password" type="password" name="password" placeholder="••••••••" autoComplete="new-password" required />
        <TextField label="Confirm Password" type="password" name="confirmPassword" placeholder="••••••••" autoComplete="new-password" required />

        {state?.error ? <p className="text-xs font-medium text-danger">{state.error}</p> : null}

        <label className="flex items-start gap-2 pt-1 text-xs text-muted">
          <input type="checkbox" required defaultChecked className="mt-0.5 h-4 w-4 rounded border-border accent-[var(--color-primary)]" />
          I agree to the Terms &amp; Conditions
        </label>

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60"
        >
          {pending ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted">or continue with</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <SocialButtons googleEnabled={googleEnabled} />

      <p className="mt-auto pt-8 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Login
        </Link>
      </p>
    </Screen>
  );
}
