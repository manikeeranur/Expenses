import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import CategoryIcon from "@/components/ui/CategoryIcon";
import CategoryForm from "@/components/CategoryForm";
import { formatCurrency } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import { getDashboardSummary } from "@/lib/data";
import { createCategory } from "@/lib/actions/categories";

export default async function CategoriesPage() {
  const userId = await requireUserId();
  const { categoriesWithSpend, totalExpenses } = await getDashboardSummary(userId);
  const categories = [...categoriesWithSpend].sort((a, b) => b.spent - a.spent);

  return (
    <Screen>
      <header className="flex items-center justify-between px-5 pb-2 pt-6 md:hidden">
        <h1 className="text-xl font-bold">Categories</h1>
        <CategoryForm mode="create" action={createCategory} />
      </header>

      <div className="hidden justify-end px-5 pt-3 md:flex md:px-8 md:pt-6">
        <CategoryForm mode="create" action={createCategory} />
      </div>

      <div className="space-y-2.5 px-5 pt-3 md:px-8">
        {categories.map((c) => (
          <Link
            key={c._id}
            href={`/categories/${c._id}`}
            className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-sm shadow-black/[0.03]"
          >
            <CategoryIcon icon={c.icon} color={c.color} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{c.name}</p>
              <p className="text-xs text-muted">
                {totalExpenses > 0 ? `${c.percent}% of total expenses` : "No spending yet"}
              </p>
            </div>
            <p className="text-sm font-semibold">{formatCurrency(c.spent)}</p>
            <ChevronRight size={16} className="text-muted" />
          </Link>
        ))}
      </div>

      <BottomNav />
    </Screen>
  );
}
