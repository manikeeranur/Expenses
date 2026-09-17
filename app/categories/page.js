import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import CategoryForm from "@/components/CategoryForm";
import CategoryList from "@/components/CategoryList";
import { requireUserId } from "@/lib/session";
import { getDashboardSummary } from "@/lib/data";
import { createCategory } from "@/lib/actions/categories";

export default async function CategoriesPage() {
  const userId = await requireUserId();
  const { categoriesWithSpend, totalExpenses } = await getDashboardSummary(userId);

  return (
    <Screen wide>
      <header className="flex items-center justify-between px-4 pb-2 pt-6 md:hidden">
        <h1 className="text-xl font-bold">Categories</h1>
        <CategoryForm mode="create" action={createCategory} />
      </header>

      <div className="hidden justify-end px-4 pt-3 md:flex md:pt-6">
        <CategoryForm mode="create" action={createCategory} />
      </div>

      <CategoryList categories={categoriesWithSpend} totalExpenses={totalExpenses} />

      <BottomNav />
    </Screen>
  );
}
