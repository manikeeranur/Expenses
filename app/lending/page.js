import { HandCoins, PiggyBank, Coins, BarChart3 } from "lucide-react";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import LendingBarChart from "@/components/charts/LendingBarChart";
import LendingBorrowersTable from "@/components/LendingBorrowersTable";
import LendingForm from "@/components/LendingForm";
import { formatCurrencyPrecise } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import { getLendings } from "@/lib/data";
import { createLending } from "@/lib/actions/lending";

function summarize(lending) {
  const interest = lending.payments.filter((p) => p.type === "interest").reduce((s, p) => s + p.amount, 0);
  const principalRepaid = lending.payments.filter((p) => p.type === "principal").reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, lending.principal - principalRepaid);
  const monthlyInterest = Math.round((outstanding * (lending.interestRatePercent || 0)) / 100);
  return { interest, principalRepaid, outstanding, monthlyInterest };
}

function StatCard({ icon, tone, label, value, valueClassName = "" }) {
  const tones = {
    primary: "bg-primary-light text-primary",
    info: "bg-info-light text-info",
    success: "bg-success-light text-success",
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone] || tones.primary}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className={`mt-0.5 text-base font-bold ${valueClassName}`}>{value}</p>
      </div>
    </div>
  );
}

export default async function LendingPage() {
  const userId = await requireUserId();
  const lendings = await getLendings(userId);
  const summaries = lendings.map((l) => ({ ...l, ...summarize(l) }));

  const totalPrincipal = summaries.reduce((s, l) => s + l.principal, 0);
  const totalOutstanding = summaries.reduce((s, l) => s + l.outstanding, 0);
  const totalInterest = summaries.reduce((s, l) => s + l.interest, 0);

  const chartData = summaries.map((l) => ({
    borrower: l.borrower,
    principal: l.principal,
    principalRepaid: l.principalRepaid,
    outstanding: l.outstanding,
    interest: l.interest,
  }));

  return (
    <Screen wide>
      <header className="flex items-center justify-between px-4 pb-2 pt-6 md:hidden">
        <h1 className="text-xl font-bold">Lending</h1>
        <LendingForm action={createLending} mode="create" variant="fab" />
      </header>

      {summaries.length ? (
        <div className="space-y-4 px-4 pt-3 md:px-8 md:pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={<HandCoins size={18} />}
              tone="primary"
              label="Total Given"
              value={formatCurrencyPrecise(totalPrincipal)}
            />
            <StatCard
              icon={<PiggyBank size={18} />}
              tone="info"
              label="Outstanding"
              value={formatCurrencyPrecise(totalOutstanding)}
            />
            <StatCard
              icon={<Coins size={18} />}
              tone="success"
              label="Interest Collected"
              value={formatCurrencyPrecise(totalInterest)}
              valueClassName="text-success"
            />
          </div>

          <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                <BarChart3 size={17} />
              </span>
              <h2 className="text-sm font-bold">Principal vs Interest by Borrower</h2>
            </div>
            <div className="mt-2">
              <LendingBarChart data={chartData} />
            </div>
          </div>

          <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                <HandCoins size={17} />
              </span>
              <h2 className="flex-1 text-sm font-bold">Borrowers</h2>
              <LendingForm action={createLending} mode="create" variant="header" className="hidden md:flex" />
            </div>

            <div className="mt-3 overflow-x-auto">
              <LendingBorrowersTable summaries={summaries} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center px-8 pt-24 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-light">
            <HandCoins size={40} className="text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="mt-6 text-lg font-bold">No Lending Entries Yet</h2>
          <p className="mt-1 text-sm text-muted">Track money you&apos;ve lent out and the interest collected on it.</p>
          <LendingForm action={createLending} mode="create" variant="empty" />
        </div>
      )}

      <BottomNav />
    </Screen>
  );
}
