import Link from "next/link";
import { Wallet, TrendingUp, PiggyBank, Target } from "lucide-react";
import Screen from "@/components/Screen";

export default function OnboardingPage() {
  return (
    <Screen withNav={false} className="flex min-h-dvh flex-col px-6 pb-10 pt-14">
      <div className="relative mx-auto flex h-64 w-64 items-center justify-center">
        <div className="absolute inset-0 rounded-[2.5rem] bg-primary-light" />
        <div className="absolute -left-2 top-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface shadow-lg shadow-black/5">
          <TrendingUp size={24} className="text-success" />
        </div>
        <div className="absolute -right-3 top-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface shadow-lg shadow-black/5">
          <PiggyBank size={22} className="text-warning" />
        </div>
        <div className="absolute -right-1 bottom-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface shadow-lg shadow-black/5">
          <Target size={24} className="text-danger" />
        </div>
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-primary shadow-xl shadow-primary/30">
          <Wallet size={48} className="text-white" strokeWidth={1.75} />
        </div>
      </div>

      <div className="mt-12 flex-1 text-center">
        <h1 className="text-[26px] font-bold leading-tight">
          Take Control of
          <br />
          Your Finances
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm text-muted">
          Track your income, manage expenses, and achieve your financial goals.
        </p>

        <div className="mt-8 flex items-center justify-center gap-1.5">
          <span className="h-1.5 w-5 rounded-full bg-primary" />
          <span className="h-1.5 w-1.5 rounded-full bg-border" />
          <span className="h-1.5 w-1.5 rounded-full bg-border" />
        </div>
      </div>

      <div className="space-y-3">
        <Link
          href="/signup"
          className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="flex w-full items-center justify-center rounded-2xl border border-border py-3.5 text-sm font-semibold text-foreground"
        >
          I already have an account
        </Link>
      </div>
    </Screen>
  );
}
