import Link from "next/link";
import { Inbox, Plus } from "lucide-react";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import TransactionRow from "@/components/TransactionRow";
import { requireUserId } from "@/lib/session";
import { getTransactions } from "@/lib/data";
import { formatDate } from "@/lib/format";

function groupByDate(items) {
  const groups = new Map();
  for (const t of items) {
    const key = new Date(t.date).toISOString().slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  }
  return [...groups.entries()].map(([date, items]) => ({
    label: formatDate(date, { day: "numeric", month: "long", year: "numeric", weekday: "long" }),
    items,
  }));
}

export default async function TransactionsPage() {
  const userId = await requireUserId();
  const transactions = await getTransactions(userId);
  const groups = groupByDate(transactions);

  return (
    <Screen>
      <header className="px-5 pb-2 pt-6 md:hidden">
        <h1 className="text-xl font-bold">Transactions</h1>
      </header>

      {transactions.length ? (
        <div className="space-y-5 px-5 pt-2">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-xs font-medium text-muted">{group.label}</p>
              <div className="space-y-2.5">
                {group.items.map((t) => (
                  <TransactionRow key={t._id} transaction={t} />
                ))}
              </div>
            </div>
          ))}
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
        </div>
      )}

      <BottomNav />
    </Screen>
  );
}
