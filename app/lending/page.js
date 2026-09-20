import { HandCoins, CircleCheckBig, Clock, Coins, Users, Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import CategoryDonut from "@/components/charts/CategoryDonut";
import LendingBorrowersTable from "@/components/LendingBorrowersTable";
import RecentLendingPayments from "@/components/RecentLendingPayments";
import UpcomingDues from "@/components/UpcomingDues";
import LendingForm from "@/components/LendingForm";
import { formatCurrencyPrecise } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import { getLendings, getRecentLendingPayments } from "@/lib/data";
import { getNextDueInfo } from "@/lib/lending";
import { createLending } from "@/lib/actions/lending";

function summarize(lending) {
  const interest = lending.payments.filter((p) => p.type === "interest").reduce((s, p) => s + p.amount, 0);
  const principalRepaid = lending.payments.filter((p) => p.type === "principal").reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, lending.principal - principalRepaid);
  const monthlyInterest = Math.round((outstanding * (lending.interestRatePercent || 0)) / 100);
  return { interest, principalRepaid, outstanding, monthlyInterest };
}

function isInCurrentMonth(date) {
  const d = new Date(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

// This month's change as a % of the value before this month's movement —
// null when there's no meaningful baseline (e.g. first-ever entry).
function pctChange(deltaThisMonth, valueBeforeThisMonth) {
  if (!valueBeforeThisMonth || valueBeforeThisMonth <= 0) return null;
  return Math.round((deltaThisMonth / valueBeforeThisMonth) * 100);
}

const BORROWER_COLORS = ["#6c5ce7", "#21c37e", "#f5a623", "#3aa0ff", "#f2555a", "#a78bfa", "#2dd4bf", "#fb923c"];

// Same borrower gets the same color across all 4 metric donuts, keyed by
// its position in the (already order-sorted) summaries list.
function donutData(summaries, key) {
  return summaries
    .map((l, i) => ({ _id: l._id, name: l.borrower, spent: l[key], color: BORROWER_COLORS[i % BORROWER_COLORS.length] }))
    .filter((d) => d.spent > 0);
}

function MetricDonutCard({ icon, tone, title, data, total }) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
      <div className="flex items-center gap-2">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      {data.length ? (
        <>
          <div className="mt-3">
            <CategoryDonut data={data} total={total} />
          </div>
          <div className="mt-4 space-y-1.5">
            {data.map((d) => (
              <div key={d._id} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="flex-1 truncate text-muted">{d.name}</span>
                <span className="font-medium">{formatCurrencyPrecise(d.spent)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-3 rounded-xl bg-background p-4 text-center text-xs text-muted">No data yet.</p>
      )}
    </div>
  );
}

function StatCard({ icon, tone, label, value, valueClassName = "", trend, trendGoodDirection = "up", footer }) {
  const tones = {
    primary: "bg-primary-light text-primary",
    info: "bg-info-light text-info",
    success: "bg-success-light text-success",
    warning: "bg-warning-light text-warning",
  };
  const hasTrend = typeof trend === "number";
  const isUp = trend >= 0;
  const isGood = trendGoodDirection === "up" ? isUp : !isUp;

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
      <div className="flex items-start justify-between gap-2">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone] || tones.primary}`}>
          {icon}
        </span>
        {hasTrend ? (
          <span
            className={`flex shrink-0 items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-semibold ${
              isGood ? "bg-success-light text-success" : "bg-danger-light text-danger"
            }`}
          >
            {isUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {isUp ? "+" : ""}
            {trend}%
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-muted">{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${valueClassName}`}>{value}</p>
      {footer}
    </div>
  );
}

export default async function LendingPage() {
  const userId = await requireUserId();
  const [lendings, recentPayments] = await Promise.all([getLendings(userId), getRecentLendingPayments(userId, 5)]);
  const summaries = lendings.map((l) => ({ ...l, ...summarize(l) }));

  const totalPrincipal = summaries.reduce((s, l) => s + l.principal, 0);
  const totalPrincipalRepaid = summaries.reduce((s, l) => s + l.principalRepaid, 0);
  const totalOutstanding = summaries.reduce((s, l) => s + l.outstanding, 0);
  const totalInterest = summaries.reduce((s, l) => s + l.interest, 0);
  const activeBorrowers = summaries.filter((l) => l.status === "active").length;
  const closedBorrowers = summaries.length - activeBorrowers;

  const lentThisMonth = summaries.filter((l) => isInCurrentMonth(l.dateGiven)).reduce((s, l) => s + l.principal, 0);
  const paidThisMonth = summaries.reduce(
    (s, l) => s + l.payments.filter((p) => p.type === "principal" && isInCurrentMonth(p.date)).reduce((s2, p) => s2 + p.amount, 0),
    0
  );
  const outstandingDelta = lentThisMonth - paidThisMonth;

  const lentTrend = pctChange(lentThisMonth, totalPrincipal - lentThisMonth);
  const paidTrend = pctChange(paidThisMonth, totalPrincipalRepaid - paidThisMonth);
  const outstandingTrend = pctChange(outstandingDelta, totalOutstanding - outstandingDelta);

  const returnedPct = totalPrincipal > 0 ? Math.round((totalPrincipalRepaid / totalPrincipal) * 1000) / 10 : 0;
  const remainingPct = totalPrincipal > 0 ? Math.round((totalOutstanding / totalPrincipal) * 1000) / 10 : 0;

  const upcomingDues = summaries
    .filter((l) => l.status === "active" && l.interestDueDay)
    .map((l) => {
      const info = getNextDueInfo(l);
      return info ? { _id: l._id, borrower: l.borrower, amount: l.monthlyInterest, due: info.due, diffDays: info.diffDays } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.diffDays - b.diffDays)
    .slice(0, 5);

  return (
    <Screen wide>
      <header className="flex items-center justify-between px-4 pb-2 pt-6 md:hidden">
        <h1 className="text-xl font-bold">Lending</h1>
        <LendingForm action={createLending} mode="create" variant="fab" />
      </header>

      {summaries.length ? (
        <div className="space-y-4 px-4 pt-3 md:px-8 md:pt-6">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 md:gap-4">
            <StatCard
              icon={<HandCoins size={18} />}
              tone="primary"
              label="Total Principal"
              value={formatCurrencyPrecise(totalPrincipal)}
              trend={lentTrend}
              footer={<p className="mt-1 text-[11px] text-muted">Across {summaries.length} borrower{summaries.length > 1 ? "s" : ""}</p>}
            />
            <StatCard
              icon={<CircleCheckBig size={18} />}
              tone="success"
              label="Total Paid Back"
              value={formatCurrencyPrecise(totalPrincipalRepaid)}
              valueClassName="text-success"
              trend={paidTrend}
              footer={<p className="mt-1 text-[11px] text-muted">{returnedPct}% returned</p>}
            />
            <StatCard
              icon={<Clock size={18} />}
              tone="warning"
              label="Outstanding"
              value={formatCurrencyPrecise(totalOutstanding)}
              valueClassName="text-warning"
              trend={outstandingTrend}
              trendGoodDirection="down"
              footer={<p className="mt-1 text-[11px] text-muted">{remainingPct}% remaining</p>}
            />
            <StatCard
              icon={<Users size={18} />}
              tone="info"
              label="Total Borrowers"
              value={summaries.length}
              footer={
                <p className="mt-1 text-[11px] text-muted">
                  Active: {activeBorrowers} &nbsp;|&nbsp; Closed: {closedBorrowers}
                </p>
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricDonutCard
              icon={<HandCoins size={17} />}
              tone="bg-danger-light text-danger"
              title="Principal"
              data={donutData(summaries, "principal")}
              total={totalPrincipal}
            />
            <MetricDonutCard
              icon={<CircleCheckBig size={17} />}
              tone="bg-success-light text-success"
              title="Principal Paid"
              data={donutData(summaries, "principalRepaid")}
              total={totalPrincipalRepaid}
            />
            <MetricDonutCard
              icon={<Clock size={17} />}
              tone="bg-warning-light text-warning"
              title="Outstanding"
              data={donutData(summaries, "outstanding")}
              total={totalOutstanding}
            />
            <MetricDonutCard
              icon={<Coins size={17} />}
              tone="bg-info-light text-info"
              title="Interest Collected"
              data={donutData(summaries, "interest")}
              total={totalInterest}
            />
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <RecentLendingPayments payments={recentPayments} />
            <UpcomingDues dues={upcomingDues} />
          </div>

          <div className="rounded-2xl bg-primary p-5 text-white shadow-lg shadow-primary/25">
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <Sparkles size={20} />
                </span>
                <div>
                  <p className="text-sm font-bold">Grow with Discipline</p>
                  <p className="text-xs text-white/75">Track your lending, collect on time and achieve your financial goals.</p>
                </div>
              </div>
              <LendingForm action={createLending} mode="create" variant="pill" className="shrink-0 text-[#6d5ce7]" />
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
