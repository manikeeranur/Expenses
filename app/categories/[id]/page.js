import { notFound } from "next/navigation";
import Screen from "@/components/Screen";
import ScreenHeader from "@/components/ScreenHeader";
import CategoryIcon from "@/components/ui/CategoryIcon";
import ProgressBar from "@/components/ui/ProgressBar";
import TransactionRow from "@/components/TransactionRow";
import MiniBarChart from "@/components/charts/MiniBarChart";
import CategoryForm from "@/components/CategoryForm";
import DeleteButton from "@/components/ui/DeleteButton";
import { formatCurrency } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import { getCategoryById, getTransactions, getCategoryStats } from "@/lib/data";
import { updateCategory, deleteCategory } from "@/lib/actions/categories";

export default async function CategoryDetailsPage({ params }) {
  const { id } = await params;
  const userId = await requireUserId();
  const category = await getCategoryById(userId, id);
  if (!category) notFound();

  const [transactions, stats] = await Promise.all([
    getTransactions(userId, { categoryId: id, limit: 10 }),
    getCategoryStats(userId, id),
  ]);

  const changePct = stats.lastMonthSpent > 0
    ? Math.round(((stats.spent - stats.lastMonthSpent) / stats.lastMonthSpent) * 1000) / 10
    : 0;
  const budgetPct = category.budget > 0 ? Math.round((stats.spent / category.budget) * 100) : 0;
  const editAction = updateCategory.bind(null, id);
  const deleteWithId = deleteCategory.bind(null, id);

  return (
    <Screen withNav={false}>
      <ScreenHeader
        title={category.name}
        right={<CategoryForm mode="edit" action={editAction} defaults={category} />}
      />

      <div className="px-5 pt-4">
        <div className="flex flex-col items-center rounded-2xl bg-surface p-6 shadow-sm shadow-black/[0.03]">
          <CategoryIcon icon={category.icon} color={category.color} size="lg" />
          <p className="mt-3 text-xs text-muted">Total Spent This Month</p>
          <p className="text-2xl font-bold">{formatCurrency(stats.spent)}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <p className="text-xs text-muted">Last Month</p>
            <p className="mt-1 text-sm font-semibold">{formatCurrency(stats.lastMonthSpent)}</p>
            {stats.lastMonthSpent > 0 ? (
              <p className={`mt-1 text-[11px] font-medium ${changePct >= 0 ? "text-danger" : "text-success"}`}>
                {changePct >= 0 ? "↑" : "↓"} {Math.abs(changePct)}%
              </p>
            ) : null}
          </div>
          <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <p className="text-xs text-muted">Transactions</p>
            <p className="mt-1 text-sm font-semibold">{stats.transactionCount}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Budget</h2>
            <span className="text-xs font-medium text-muted">
              {formatCurrency(stats.spent)} / {formatCurrency(category.budget)}
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar value={stats.spent} max={category.budget || 1} color={category.color} />
          </div>
          <p className="mt-2 text-[11px] text-muted">{budgetPct}% of budget used</p>
        </div>

        {stats.weeklyTrend.length > 0 ? (
          <div className="mt-4 rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <h2 className="text-sm font-semibold">Spending Trend</h2>
            <MiniBarChart data={stats.weeklyTrend} color={category.color} />
          </div>
        ) : null}

        <div className="mt-4">
          <h2 className="text-sm font-semibold">Recent Transactions</h2>
          <div className="mt-3 space-y-2.5">
            {transactions.length ? (
              transactions.map((t) => <TransactionRow key={t._id} transaction={t} />)
            ) : (
              <p className="rounded-2xl bg-surface p-4 text-center text-xs text-muted shadow-sm shadow-black/[0.03]">
                No transactions in this category yet.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <DeleteButton
            action={deleteWithId}
            variant="block"
            label="Delete Category"
            confirmText="Delete this category? Existing transactions will keep it as an uncategorized reference."
          />
        </div>
      </div>
    </Screen>
  );
}
