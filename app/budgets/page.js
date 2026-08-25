import Link from "next/link";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import CategoryIcon from "@/components/ui/CategoryIcon";
import ProgressBar from "@/components/ui/ProgressBar";
import { formatCurrency } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import { getDashboardSummary } from "@/lib/data";

export default async function BudgetsPage() {
  const userId = await requireUserId();
  const { categoriesWithSpend, totalExpenses, totalBudget, budgetStatusLabel } = await getDashboardSummary(userId);
  const monthLabel = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <Screen>
      <header className="flex items-center justify-between px-5 pb-2 pt-6 md:hidden">
        <h1 className="text-xl font-bold">Budgets</h1>
        <span className="text-sm font-semibold">{monthLabel}</span>
      </header>

      <div className="px-5 pt-3">
        <div className="rounded-2xl bg-primary p-5 text-white shadow-lg shadow-primary/25">
          <div className="flex items-center justify-between text-xs text-white/80">
            <span>Overall Budget</span>
            <span>{budgetStatusLabel}</span>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {formatCurrency(totalExpenses)}
            <span className="text-sm font-medium text-white/70"> / {formatCurrency(totalBudget)}</span>
          </p>
          <div className="mt-3">
            <ProgressBar value={totalExpenses} max={totalBudget || 1} color="#ffffff" trackClassName="bg-white/25" />
          </div>
        </div>

        <div className="mt-5">
          <h2 className="text-sm font-semibold">Monthly Budgets</h2>
        </div>

        <div className="mt-3 space-y-3">
          {categoriesWithSpend.map((c) => {
            const pct = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;
            const status = pct >= 100 ? "Over Budget" : pct >= 90 ? "Approaching Limit" : "On Track";
            const statusTone = pct >= 100 ? "text-danger" : pct >= 90 ? "text-warning" : "text-success";
            return (
              <Link
                key={c._id}
                href={`/categories/${c._id}`}
                className="block rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-muted">
                      {formatCurrency(c.spent)} / {formatCurrency(c.budget)}
                    </p>
                  </div>
                  <span className={`text-xs font-medium ${statusTone}`}>{status}</span>
                </div>
                <div className="mt-3">
                  <ProgressBar value={c.spent} max={c.budget || 1} color={c.color} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </Screen>
  );
}
