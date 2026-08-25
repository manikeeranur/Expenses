import Screen from "@/components/Screen";
import ScreenHeader from "@/components/ScreenHeader";
import TrendLineChart from "@/components/charts/TrendLineChart";
import { formatCurrency } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import { getMonthlyTrend } from "@/lib/data";

export default async function ReportsTrendsPage() {
  const userId = await requireUserId();
  const data = await getMonthlyTrend(userId, 6);

  const thisMonth = data[data.length - 1]?.value || 0;
  const lastMonth = data[data.length - 2]?.value || 0;
  const changePct = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 1000) / 10 : 0;

  const highest = data.reduce((max, m) => (m.value > max.value ? m : max), data[0] || { month: "-", value: 0 });
  const lowest = data.reduce((min, m) => (m.value < min.value ? m : min), data[0] || { month: "-", value: 0 });
  const hasData = data.some((m) => m.value > 0);

  return (
    <Screen withNav={false}>
      <ScreenHeader title="Expense Trends" subtitle="Last 6 Months" />

      <div className="px-5 pt-4">
        <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs text-muted">This Month</p>
              <p className="text-2xl font-bold">{formatCurrency(thisMonth)}</p>
            </div>
            {lastMonth > 0 ? (
              <span className={`text-xs font-semibold ${changePct >= 0 ? "text-danger" : "text-success"}`}>
                {changePct >= 0 ? "↑" : "↓"} {Math.abs(changePct)}%
              </span>
            ) : null}
          </div>
          {hasData ? (
            <TrendLineChart data={data.map((m) => ({ ...m, highlight: m.isCurrent }))} />
          ) : (
            <p className="py-10 text-center text-xs text-muted">No expense history yet.</p>
          )}
        </div>

        <div className="mt-4 rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
          <h2 className="text-sm font-semibold">Monthly Comparison</h2>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[11px] text-muted">This Month</p>
              <p className="mt-1 text-sm font-semibold">{formatCurrency(thisMonth)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Highest Month</p>
              <p className="mt-1 text-sm font-semibold">{formatCurrency(highest.value)}</p>
              <p className="text-[10px] text-muted">{highest.month}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Lowest Month</p>
              <p className="mt-1 text-sm font-semibold">{formatCurrency(lowest.value)}</p>
              <p className="text-[10px] text-muted">{lowest.month}</p>
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
}
