import { notFound } from "next/navigation";
import Screen from "@/components/Screen";
import ScreenHeader from "@/components/ScreenHeader";
import CircularProgress from "@/components/ui/CircularProgress";
import ContributionForm from "@/components/ContributionForm";
import DeleteButton from "@/components/ui/DeleteButton";
import { getIcon } from "@/lib/icons";
import { formatCurrency, formatDate } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import { getGoalById } from "@/lib/data";
import { addContribution, deleteGoal } from "@/lib/actions/goals";

export default async function GoalDetailsPage({ params }) {
  const { id } = await params;
  const userId = await requireUserId();
  const goal = await getGoalById(userId, id);
  if (!goal) notFound();

  const Icon = getIcon(goal.icon);
  const pct = Math.min(100, Math.round((goal.saved / goal.target) * 100));
  const remaining = Math.max(0, goal.target - goal.saved);
  const targetDate = formatDate(goal.dueDate);
  const contributeAction = addContribution.bind(null, id);
  const deleteWithId = deleteGoal.bind(null, id);

  return (
    <Screen withNav={false}>
      <ScreenHeader title={goal.name} />

      <div className="px-5 pt-4">
        <div
          className="rounded-3xl p-6 text-white shadow-xl"
          style={{ background: `linear-gradient(135deg, ${goal.color}, ${goal.color}cc)` }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-white/75">Target Date</p>
              <p className="text-sm font-semibold">{targetDate}</p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/75">Saved Amount</p>
              <p className="mt-1 text-2xl font-bold">{formatCurrency(goal.saved)}</p>
              <p className="mt-3 text-xs text-white/75">Remaining</p>
              <p className="text-sm font-semibold">{formatCurrency(remaining)}</p>
            </div>
            <CircularProgress value={pct} size={104} color="#ffffff">
              <span className="text-lg font-bold">{pct}%</span>
            </CircularProgress>
          </div>
        </div>

        <ContributionForm action={contributeAction} color={goal.color} />

        <div className="mt-5">
          <h2 className="text-sm font-semibold">Recent Contributions</h2>
          <div className="mt-3 space-y-2.5">
            {goal.contributions.length ? (
              goal.contributions.slice(0, 10).map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded-2xl bg-surface p-3.5 shadow-sm shadow-black/[0.03]">
                  <span className="text-sm text-muted">{formatDate(c.date)}</span>
                  <span className="text-sm font-semibold text-success">+{formatCurrency(c.amount)}</span>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-surface p-4 text-center text-xs text-muted shadow-sm shadow-black/[0.03]">
                No contributions yet.
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <DeleteButton action={deleteWithId} variant="block" label="Delete Goal" confirmText="Delete this goal?" />
        </div>
      </div>
    </Screen>
  );
}
