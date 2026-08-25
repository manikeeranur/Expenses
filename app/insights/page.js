import { getIcon } from "@/lib/icons";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import { requireUserId } from "@/lib/session";
import { getInsights } from "@/lib/data";

const toneStyles = {
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  danger: "bg-danger-light text-danger",
  info: "bg-info-light text-info",
};

export default async function InsightsPage() {
  const userId = await requireUserId();
  const insights = await getInsights(userId);

  return (
    <Screen>
      <header className="px-5 pb-2 pt-6 md:hidden">
        <h1 className="text-xl font-bold">Insights</h1>
        <p className="mt-1 text-sm text-muted">Smart observations from your spending this month</p>
      </header>

      <div className="space-y-3 px-5 pt-3">
        {insights.map((i) => {
          const Icon = getIcon(i.icon);
          return (
            <div key={i.id} className="flex items-start gap-3 rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneStyles[i.tone]}`}>
                <Icon size={18} />
              </span>
              <p className="pt-1.5 text-sm leading-snug">{i.title}</p>
            </div>
          );
        })}
      </div>

      <BottomNav />
    </Screen>
  );
}
