import Link from "next/link";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { formatCurrency } from "@/lib/format";

export default function TransactionRow({ transaction }) {
  const isIncome = transaction.type === "income";
  const category = transaction.categoryId;

  return (
    <Link
      href={`/transactions/${transaction._id}`}
      className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-sm shadow-black/[0.03]"
    >
      <CategoryIcon
        icon={isIncome ? "Landmark" : category?.icon}
        color={isIncome ? "#21C37E" : category?.color || "#9AA0B4"}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{transaction.title}</p>
        <p className="truncate text-xs text-muted">{isIncome ? "Income" : category?.name || "Uncategorized"}</p>
      </div>
      <p className={`shrink-0 text-sm font-semibold ${isIncome ? "text-success" : "text-danger"}`}>
        {isIncome ? "+" : "-"}
        {formatCurrency(transaction.amount)}
      </p>
    </Link>
  );
}
