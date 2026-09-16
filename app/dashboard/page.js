import Link from "next/link";
import { Bell, TrendingDown, TrendingUp, PiggyBank, Target } from "lucide-react";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import StatCard from "@/components/ui/StatCard";
import CategoryIcon from "@/components/ui/CategoryIcon";
import ExpenseAreaChart from "@/components/charts/ExpenseAreaChart";
import CategoryDonut from "@/components/charts/CategoryDonut";
import { formatCurrency } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import { getDashboardSummary, getExpenseTrendForMonth, getTransactions, getNotifications } from "@/lib/data";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const [summary, expenseTrend, recent, notifications] = await Promise.all([
    getDashboardSummary(userId),
    getExpenseTrendForMonth(userId),
    getTransactions(userId, { limit: 3 }),
    getNotifications(userId),
  ]);

  const topCategories = [...summary.categoriesWithSpend].sort((a, b) => b.spent - a.spent).slice(0, 4);
  const spendingCategories = summary.categoriesWithSpend.filter((c) => c.spent > 0).sort((a, b) => b.spent - a.spent);
  const unread = notifications.some((n) => !n.read);
  const monthLabel = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <Screen wide>
      <header className="flex items-center justify-between px-4 pb-2 pt-6 md:hidden">
        <span className="text-sm font-semibold">{monthLabel}</span>
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface shadow-sm shadow-black/5"
        >
          <Bell size={18} />
          {unread ? <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-danger" /> : null}
        </Link>
      </header>

      <div className="space-y-4 px-4 pt-3 md:pt-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            icon={<TrendingDown size={16} className="text-primary" />}
            label="Total Expenses"
            value={formatCurrency(summary.totalExpenses)}
            changePct={summary.expensesChangePct}
            changeLabel="from last month"
            tone="info"
          />
          <StatCard
            icon={<TrendingUp size={16} className="text-primary" />}
            label="Total Income"
            value={formatCurrency(summary.totalIncome)}
            changePct={summary.incomeChangePct}
            changeLabel="from last month"
            tone="success"
          />
          <StatCard icon={<PiggyBank size={16} className="text-primary" />} label="Savings" value={formatCurrency(summary.savings)} />
          <StatCard
            icon={<Target size={16} className="text-primary" />}
            label="Budget Status"
            value={`${summary.budgetStatusPct}%`}
            tone={summary.budgetStatusPct >= 100 ? "danger" : "success"}
          />
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-4 lg:space-y-0">
          <div className="flex flex-col rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Expenses Overview</h2>
                <p className="mt-0.5 text-lg font-bold">{formatCurrency(summary.totalExpenses)}</p>
              </div>
              <span className="text-xs text-muted">This Month</span>
            </div>
            <div className="mt-2 min-h-[220px] flex-1">
              {expenseTrend.length ? (
                <ExpenseAreaChart data={expenseTrend} />
              ) : (
                <p className="py-10 text-center text-xs text-muted">No expenses recorded yet this month.</p>
              )}
            </div>
          </div>

          <div className="flex flex-col rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Expense by Category</h2>
              <span className="text-xs text-muted">This Month</span>
            </div>
            {spendingCategories.length ? (
              <>
                <div className="mt-3">
                  <CategoryDonut data={spendingCategories} total={summary.totalExpenses} />
                </div>
                <div className="mt-4 space-y-2">
                  {spendingCategories.slice(0, 6).map((c) => (
                    <div key={c._id} className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="flex-1 truncate text-muted">{c.name}</span>
                      <span className="font-medium">{formatCurrency(c.spent)}</span>
                    </div>
                  ))}
                </div>
                <Link href="/reports" className="mt-4 block text-xs font-medium text-primary">
                  View full report →
                </Link>
              </>
            ) : (
              <p className="py-10 text-center text-xs text-muted">No expenses recorded yet this month.</p>
            )}
          </div>
        </div>

        <div className="md:grid md:grid-cols-2 md:items-start md:gap-4 md:space-y-0 space-y-4">
          <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Recent Transactions</h2>
              <Link href="/transactions" className="text-xs font-medium text-primary">
                View All
              </Link>
            </div>
            {recent.length ? (
              <ul className="mt-3 space-y-3">
                {recent.map((t) => {
                  const isIncome = t.type === "income";
                  const category = t.categoryId;
                  return (
                    <li key={t._id} className="flex items-center gap-3">
                      <CategoryIcon
                        icon={isIncome ? "Landmark" : category?.icon}
                        color={isIncome ? "#21C37E" : category?.color || "#9AA0B4"}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{t.title}</p>
                        <p className="truncate text-xs text-muted">{isIncome ? "Income" : category?.name || "Uncategorized"}</p>
                      </div>
                      <span className={`shrink-0 text-sm font-semibold ${isIncome ? "text-success" : "text-danger"}`}>
                        {isIncome ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 text-center text-xs text-muted">No transactions yet.</p>
            )}
          </div>

          <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Top Categories</h2>
              <Link href="/categories" className="text-xs font-medium text-primary">
                View All
              </Link>
            </div>
            {topCategories.length ? (
              <ul className="mt-3 space-y-3">
                {topCategories.map((c) => (
                  <li key={c._id} className="flex items-center gap-3">
                    <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                    <span className="flex-1 text-sm">{c.name}</span>
                    <span className="text-xs text-muted">{c.percent}%</span>
                    <span className="w-20 text-right text-sm font-semibold">{formatCurrency(c.spent)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-center text-xs text-muted">No spending yet this month.</p>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </Screen>
  );
}
