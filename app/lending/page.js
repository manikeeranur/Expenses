import Link from "next/link";
import { Plus, HandCoins } from "lucide-react";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import Tag from "@/components/ui/Tag";
import LendingBarChart from "@/components/charts/LendingBarChart";
import { formatCurrencyPrecise, formatDateShort, daysSince, ordinal } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import { getLendings } from "@/lib/data";

function summarize(lending) {
  const interest = lending.payments.filter((p) => p.type === "interest").reduce((s, p) => s + p.amount, 0);
  const principalRepaid = lending.payments.filter((p) => p.type === "principal").reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, lending.principal - principalRepaid);
  const monthlyInterest = Math.round((outstanding * (lending.interestRatePercent || 0)) / 100);
  return { interest, principalRepaid, outstanding, monthlyInterest };
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
    outstanding: l.outstanding,
    interest: l.interest,
  }));

  return (
    <Screen>
      <header className="flex items-center justify-between px-5 pb-2 pt-6 md:hidden">
        <h1 className="text-xl font-bold">Lending</h1>
        <Link
          href="/lending/new"
          aria-label="Add lending entry"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/25"
        >
          <Plus size={18} />
        </Link>
      </header>

      {summaries.length ? (
        <div className="px-5 pt-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-surface p-3.5 shadow-sm shadow-black/[0.03]">
              <p className="text-[11px] text-muted">Total Given</p>
              <p className="mt-1 text-sm font-bold">{formatCurrencyPrecise(totalPrincipal)}</p>
            </div>
            <div className="rounded-2xl bg-surface p-3.5 shadow-sm shadow-black/[0.03]">
              <p className="text-[11px] text-muted">Outstanding</p>
              <p className="mt-1 text-sm font-bold">{formatCurrencyPrecise(totalOutstanding)}</p>
            </div>
            <div className="rounded-2xl bg-surface p-3.5 shadow-sm shadow-black/[0.03]">
              <p className="text-[11px] text-muted">Interest Collected</p>
              <p className="mt-1 text-sm font-bold text-success">{formatCurrencyPrecise(totalInterest)}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <h2 className="text-sm font-semibold">Principal vs Interest by Borrower</h2>
            <div className="mt-2">
              <LendingBarChart data={chartData} />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {summaries.map((l) => (
              <Link
                key={l._id}
                href={`/lending/${l._id}`}
                className="block rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{l.borrower}</p>
                    <p className="text-xs text-muted">
                      Given {formatDateShort(l.dateGiven)} · {daysSince(l.dateGiven)} days ago
                    </p>
                    {l.mobile ? <p className="text-xs text-muted">{l.mobile}</p> : null}
                  </div>
                  <Tag tone={l.status === "closed" ? "neutral" : "success"}>
                    {l.status === "closed" ? "Closed" : "Active"}
                  </Tag>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-border pt-3">
                  <div>
                    <p className="text-[11px] text-muted">Principal</p>
                    <p className="text-sm font-semibold">{formatCurrencyPrecise(l.principal)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted">Principal Paid</p>
                    <p className="text-sm font-semibold">{formatCurrencyPrecise(l.principalRepaid)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted">Outstanding</p>
                    <p className="text-sm font-semibold">{formatCurrencyPrecise(l.outstanding)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted">Interest Collected</p>
                    <p className="text-sm font-semibold text-success">{formatCurrencyPrecise(l.interest)}</p>
                  </div>
                </div>

                {l.status !== "closed" ? (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-primary-light px-3 py-2">
                    <span className="text-xs font-medium text-primary-dark">
                      Monthly Interest Due
                      {l.interestDueDay ? ` (${ordinal(l.interestDueDay)})` : ""}
                    </span>
                    <span className="text-sm font-bold text-primary-dark">{formatCurrencyPrecise(l.monthlyInterest)}</span>
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center px-8 pt-24 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-light">
            <HandCoins size={40} className="text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="mt-6 text-lg font-bold">No Lending Entries Yet</h2>
          <p className="mt-1 text-sm text-muted">Track money you&apos;ve lent out and the interest collected on it.</p>
          <Link
            href="/lending/new"
            className="mt-6 flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25"
          >
            <Plus size={16} />
            Add Entry
          </Link>
        </div>
      )}

      <BottomNav />
    </Screen>
  );
}
