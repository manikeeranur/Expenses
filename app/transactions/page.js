import Link from "next/link";
import { Inbox, Plus, QrCode, TrendingUp, TrendingDown, Wallet, BarChart3, IndianRupee } from "lucide-react";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import CategoryIcon from "@/components/ui/CategoryIcon";
import Tag from "@/components/ui/Tag";
import TransactionActionsMenu from "@/components/TransactionActionsMenu";
import EditTransactionModal from "@/components/EditTransactionModal";
import DownloadTransactionsPdf from "@/components/DownloadTransactionsPdf";
import IncomeExpenseChart from "@/components/charts/IncomeExpenseChart";
import { requireUserId } from "@/lib/session";
import { getTransactions, getMonthlyIncomeExpense } from "@/lib/data";
import { formatCurrency, formatCurrencyPrecise, formatDateShort } from "@/lib/format";
import { deleteTransaction } from "@/lib/actions/transactions";
import { UNSETTLED_UPI_STATUSES } from "@/lib/upi";

const PAYMENT_STATUS_TAG = {
  initiated: { tone: "warning", label: "Pending" },
  pending: { tone: "warning", label: "Pending" },
  cancelled: { tone: "danger", label: "Cancelled" },
};

function StatCard({ icon, tone, label, value, valueClassName = "" }) {
  const tones = {
    success: "bg-success-light text-success",
    danger: "bg-danger-light text-danger",
    info: "bg-info-light text-info",
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

function TransactionTable({ transactions, net }) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
          <IndianRupee size={17} />
        </span>
        <h2 className="flex-1 text-sm font-bold">All Transactions</h2>
        <span className="flex items-center gap-2 rounded-full bg-background px-3 py-1.5">
          <span className="text-[11px] text-muted">Net</span>
          <span className={`text-xs font-bold ${net >= 0 ? "text-success" : "text-danger"}`}>{formatCurrencyPrecise(net)}</span>
        </span>
      </div>

      {transactions.length ? (
        <>
          {/* Card layout below md — the table's fixed columns squeeze too hard on phone widths */}
          <div className="mt-3 divide-y divide-border md:hidden">
            {transactions.map((t) => {
              const isIncome = t.type === "income";
              const category = t.categoryId;
              return (
                <div key={t._id} className="flex items-start gap-3 py-3">
                  <CategoryIcon
                    icon={isIncome ? "Landmark" : category?.icon}
                    color={isIncome ? "#21C37E" : category?.color || "#9AA0B4"}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{t.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[11px] text-muted">{formatDateShort(t.date)}</span>
                      <span className="text-[11px] text-muted">
                        {isIncome ? "Income" : category?.name || "Uncategorized"}
                      </span>
                      {PAYMENT_STATUS_TAG[t.paymentStatus] ? (
                        <Tag tone={PAYMENT_STATUS_TAG[t.paymentStatus].tone}>{PAYMENT_STATUS_TAG[t.paymentStatus].label}</Tag>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`text-sm font-semibold ${isIncome ? "text-success" : "text-danger"}`}>
                      {isIncome ? "+" : "-"}
                      {formatCurrencyPrecise(t.amount)}
                    </span>
                    <TransactionActionsMenu
                      editSlot={<EditTransactionModal transaction={t} />}
                      deleteAction={deleteTransaction.bind(null, t._id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table layout from md up, where there's room for columns */}
          <div className="mt-3 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[420px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[50%]" />
                <col className="w-[26%]" />
                <col className="w-[15%]" />
                <col className="w-[9%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 text-[11px] font-medium text-muted">Date</th>
                  <th className="pb-2 text-[11px] font-medium text-muted">Category</th>
                  <th className="pb-2 text-right text-[11px] font-medium text-muted">Amount</th>
                  <th className="pb-2 text-right text-[11px] font-medium text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((t) => {
                  const isIncome = t.type === "income";
                  const category = t.categoryId;
                  return (
                    <tr key={t._id}>
                      <td className="truncate py-3 text-sm text-muted">
                        {formatDateShort(t.date)}
                        <span className="block truncate text-[11px] text-muted">{t.title}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <CategoryIcon
                            icon={isIncome ? "Landmark" : category?.icon}
                            color={isIncome ? "#21C37E" : category?.color || "#9AA0B4"}
                            size="sm"
                          />
                          <span className="truncate text-xs text-muted">
                            {isIncome ? "Income" : category?.name || "Uncategorized"}
                          </span>
                          {PAYMENT_STATUS_TAG[t.paymentStatus] ? (
                            <Tag tone={PAYMENT_STATUS_TAG[t.paymentStatus].tone}>{PAYMENT_STATUS_TAG[t.paymentStatus].label}</Tag>
                          ) : null}
                        </div>
                      </td>
                      <td
                        className={`truncate py-3 text-right text-sm font-semibold ${isIncome ? "text-success" : "text-danger"}`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrencyPrecise(t.amount)}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end">
                          <TransactionActionsMenu
                            editSlot={<EditTransactionModal transaction={t} />}
                            deleteAction={deleteTransaction.bind(null, t._id)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="mt-3 rounded-xl bg-background p-4 text-center text-xs text-muted">No transactions yet.</p>
      )}

      <DownloadTransactionsPdf />
    </div>
  );
}

export default async function TransactionsPage() {
  const userId = await requireUserId();
  const [transactions, trend] = await Promise.all([
    getTransactions(userId),
    getMonthlyIncomeExpense(userId, 6),
  ]);

  const isSettled = (t) => !UNSETTLED_UPI_STATUSES.includes(t.paymentStatus);
  const totalIncome = transactions.filter((t) => t.type === "income" && isSettled(t)).reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense" && isSettled(t)).reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpenses;

  return (
    <Screen wide>
      <header className="flex items-center justify-between px-4 pb-2 pt-6 md:hidden">
        <h1 className="text-xl font-bold">Transactions</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/transactions/pay"
            aria-label="Pay via UPI"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-primary shadow-sm shadow-black/5"
          >
            <QrCode size={18} />
          </Link>
          <Link
            href="/transactions/add"
            aria-label="Add transaction"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/25"
          >
            <Plus size={18} />
          </Link>
        </div>
      </header>

      {transactions.length ? (
        <div className="space-y-4 px-4 pt-3 md:px-8 md:pt-6">
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon={<TrendingDown size={18} />}
              tone="danger"
              label="Total Debit"
              value={formatCurrency(totalExpenses)}
              valueClassName="text-danger"
            />
            <StatCard
              icon={<TrendingUp size={18} />}
              tone="success"
              label="Total Credit"
              value={formatCurrency(totalIncome)}
              valueClassName="text-success"
            />
            <StatCard
              icon={<Wallet size={18} />}
              tone="info"
              label="Net"
              value={formatCurrency(net)}
              valueClassName={net >= 0 ? "text-success" : "text-danger"}
            />
          </div>

          <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                <BarChart3 size={17} />
              </span>
              <h2 className="text-sm font-bold">Income vs Expense (Last 6 Months)</h2>
            </div>
            <div className="mt-2">
              <IncomeExpenseChart data={trend} />
            </div>
          </div>

          <TransactionTable transactions={transactions} net={net} />
        </div>
      ) : (
        <div className="flex flex-col items-center px-8 pt-24 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-light">
            <Inbox size={40} className="text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="mt-6 text-lg font-bold">No Transactions Yet</h2>
          <p className="mt-1 text-sm text-muted">Start by adding your first transaction.</p>
          <Link
            href="/transactions/add"
            className="mt-6 flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25"
          >
            <Plus size={16} />
            Add Transaction
          </Link>
          <Link href="/transactions/pay" className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-primary">
            <QrCode size={14} />
            Pay via UPI
          </Link>
        </div>
      )}

      <BottomNav />
    </Screen>
  );
}
