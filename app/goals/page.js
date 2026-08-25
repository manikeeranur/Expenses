import Link from "next/link";
import { Plus, Target } from "lucide-react";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import CategoryIcon from "@/components/ui/CategoryIcon";
import ProgressBar from "@/components/ui/ProgressBar";
import { formatCurrency } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import { getGoals } from "@/lib/data";

export default async function GoalsPage() {
  const userId = await requireUserId();
  const goals = await getGoals(userId);
  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);

  return (
    <Screen>
      <header className="flex items-center justify-between px-5 pb-2 pt-6 md:hidden">
        <h1 className="text-xl font-bold">Goals</h1>
        <Link
          href="/goals/new"
          aria-label="Add goal"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/25"
        >
          <Plus size={18} />
        </Link>
      </header>

      {goals.length ? (
        <div className="px-5 pt-3">
          <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <p className="text-xs text-muted">Total Saved Across Goals</p>
            <p className="mt-1 text-xl font-bold">
              {formatCurrency(totalSaved)}
              <span className="text-sm font-medium text-muted"> / {formatCurrency(totalTarget)}</span>
            </p>
            <div className="mt-3">
              <ProgressBar value={totalSaved} max={totalTarget || 1} />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {goals.map((g) => {
              const pct = Math.round((g.saved / g.target) * 100);
              return (
                <Link
                  key={g._id}
                  href={`/goals/${g._id}`}
                  className="block rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]"
                >
                  <div className="flex items-center gap-3">
                    <CategoryIcon icon={g.icon} color={g.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{g.name}</p>
                      <p className="text-xs text-muted">
                        {formatCurrency(g.saved)} / {formatCurrency(g.target)}
                      </p>
                    </div>
                    <span className="text-sm font-bold" style={{ color: g.color }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={g.saved} max={g.target} color={g.color} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center px-8 pt-24 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-light">
            <Target size={40} className="text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="mt-6 text-lg font-bold">No Goals Yet</h2>
          <p className="mt-1 text-sm text-muted">Set a savings goal to start tracking progress.</p>
          <Link
            href="/goals/new"
            className="mt-6 flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25"
          >
            <Plus size={16} />
            Add Goal
          </Link>
        </div>
      )}

      <BottomNav />
    </Screen>
  );
}
