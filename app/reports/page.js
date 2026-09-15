import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import CategoryDonut from "@/components/charts/CategoryDonut";
import { formatCurrency } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import { getDashboardSummary } from "@/lib/data";

export default async function ReportsPage() {
  const userId = await requireUserId();
  const { categoriesWithSpend, totalExpenses, totalIncome, expensesChangePct, incomeChangePct, savingsRatePct } =
    await getDashboardSummary(userId);
  const spendingCategories = categoriesWithSpend.filter((c) => c.spent > 0).sort((a, b) => b.spent - a.spent);
  const monthLabel = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <Screen wide>
      <header className="flex items-center justify-between px-4 pb-2 pt-6 md:hidden">
        <h1 className="text-xl font-bold">Reports</h1>
        <span className="text-sm font-semibold">{monthLabel}</span>
      </header>

      <div className="px-4 pt-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <p className="text-xs text-muted">Total Expenses</p>
            <p className="mt-1 text-lg font-bold">{formatCurrency(totalExpenses)}</p>
            <p className={`mt-1 text-[11px] font-medium ${expensesChangePct >= 0 ? "text-danger" : "text-success"}`}>
              {expensesChangePct >= 0 ? "↑" : "↓"} {Math.abs(expensesChangePct)}% vs last month
            </p>
          </div>
          <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <p className="text-xs text-muted">Total Income</p>
            <p className="mt-1 text-lg font-bold">{formatCurrency(totalIncome)}</p>
            <p className={`mt-1 text-[11px] font-medium ${incomeChangePct >= 0 ? "text-success" : "text-danger"}`}>
              {incomeChangePct >= 0 ? "↑" : "↓"} {Math.abs(incomeChangePct)}% vs last month
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-surface p-5 shadow-sm shadow-black/[0.03]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Expenses Chart</h2>
            <span className="text-xs text-muted">Savings Rate {savingsRatePct}%</span>
          </div>
          {spendingCategories.length ? (
            <>
              <CategoryDonut data={spendingCategories} total={totalExpenses} />
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                {spendingCategories.slice(0, 6).map((c) => (
                  <div key={c._id} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="flex-1 truncate text-muted">{c.name}</span>
                    <span className="font-medium">{c.percent}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="py-10 text-center text-xs text-muted">No expenses recorded yet this month.</p>
          )}
        </div>

        <Link
          href="/reports/trends"
          className="mt-4 flex items-center justify-between rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]"
        >
          <div>
            <p className="text-sm font-semibold">Expense Trends</p>
            <p className="mt-0.5 text-xs text-muted">View 6-month history</p>
          </div>
          <ChevronRight size={18} className="text-muted" />
        </Link>

        <Link
          href="/export"
          className="mt-3 flex w-full items-center justify-center rounded-2xl border border-border py-3.5 text-sm font-semibold"
        >
          View Full Report
        </Link>
      </div>

      <BottomNav />
    </Screen>
  );
}
