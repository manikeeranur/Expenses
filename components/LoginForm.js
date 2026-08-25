"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";
import Screen from "@/components/Screen";
import TextField from "@/components/ui/TextField";
import SocialButtons from "@/components/ui/SocialButtons";
import { login } from "@/lib/actions/auth";

export default function LoginForm({ googleEnabled }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <Screen withNav={false} className="flex min-h-dvh flex-col px-6 pb-10 pt-14">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
        <Wallet size={26} className="text-white" />
      </div>

      <h1 className="mt-6 text-2xl font-bold">Welcome Back 👋</h1>
      <p className="mt-1 text-sm text-muted">Login to continue to your account</p>

      <form action={action} className="mt-8 space-y-4">
        <TextField label="Email Address" type="email" name="email" placeholder="isak@example.com" />
        <TextField label="Password" type="password" name="password" placeholder="••••••••" />

        {state?.error ? <p className="text-xs font-medium text-danger">{state.error}</p> : null}

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border accent-[var(--color-primary)]" />
            Remember me
          </label>
          <Link href="#" className="text-xs font-medium text-primary">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60"
        >
          {pending ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted">or continue with</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <SocialButtons googleEnabled={googleEnabled} />

      <p className="mt-auto pt-8 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-primary">
          Sign Up
        </Link>
      </p>
    </Screen>
  );
}
