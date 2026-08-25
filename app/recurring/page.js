import { Repeat } from "lucide-react";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import CategoryIcon from "@/components/ui/CategoryIcon";
import RecurringForm from "@/components/RecurringForm";
import DeleteButton from "@/components/ui/DeleteButton";
import { formatCurrency, formatDate } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import { getRecurringPayments, getCategories } from "@/lib/data";
import { createRecurring, deleteRecurring } from "@/lib/actions/recurring";

export default async function RecurringPage() {
  const userId = await requireUserId();
  const [payments, categories] = await Promise.all([getRecurringPayments(userId), getCategories(userId)]);

  return (
    <Screen>
      <header className="flex items-center justify-between px-5 pb-2 pt-6 md:hidden">
        <h1 className="text-xl font-bold">Recurring Payments</h1>
        <RecurringForm action={createRecurring} categories={categories} />
      </header>

      {payments.length ? (
        <div className="space-y-2.5 px-5 pt-3">
          {payments.map((r) => {
            const deleteWithId = deleteRecurring.bind(null, r._id);
            return (
              <div key={r._id} className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-sm shadow-black/[0.03]">
                <CategoryIcon icon={r.categoryId?.icon} color={r.categoryId?.color || "#9AA0B4"} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-muted">{r.frequency}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(r.amount)}</p>
                  <p className="text-[11px] text-muted">Next {formatDate(r.nextDate, { day: "numeric", month: "short" })}</p>
                </div>
                <DeleteButton action={deleteWithId} label="Delete recurring payment" />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center px-8 pt-24 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-light">
            <Repeat size={40} className="text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="mt-6 text-lg font-bold">No Recurring Payments</h2>
          <p className="mt-1 text-sm text-muted">Track subscriptions and bills that repeat every month.</p>
        </div>
      )}

      <BottomNav />
    </Screen>
  );
}
