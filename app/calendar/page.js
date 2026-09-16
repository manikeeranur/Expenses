import Link from "next/link";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import CalendarGrid from "@/components/CalendarGrid";
import { requireUserId } from "@/lib/session";
import { getCalendarEventsForMonth } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

function StatCard({ icon, tone, label, value, valueClassName = "" }) {
  const tones = {
    success: "bg-success-light text-success",
    danger: "bg-danger-light text-danger",
    info: "bg-info-light text-info",
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone] || tones.info}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className={`mt-0.5 text-base font-bold ${valueClassName}`}>{value}</p>
      </div>
    </div>
  );
}

export default async function CalendarPage({ searchParams }) {
  const userId = await requireUserId();
  const params = await searchParams;
  const now = new Date();
  const year = Number(params?.year) || now.getFullYear();
  const month = params?.month !== undefined ? Number(params.month) : now.getMonth();

  const eventsByDate = await getCalendarEventsForMonth(userId, year, month);
  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const allEvents = Object.values(eventsByDate).flat();
  const totalIncome = allEvents.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const totalExpenses = allEvents.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const net = totalIncome - totalExpenses;

  const prev = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const next = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
  const todayKey = now.toISOString().slice(0, 10);
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  return (
    <Screen wide>
      <header className="flex items-center justify-between px-4 pb-2 pt-6 md:hidden">
        <h1 className="text-xl font-bold">Calendar</h1>
      </header>

      <div className="space-y-4 px-4 pt-3 md:px-8 md:pt-6">
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={<TrendingUp size={18} />}
            tone="success"
            label="Income"
            value={formatCurrency(totalIncome)}
            valueClassName="text-success"
          />
          <StatCard
            icon={<TrendingDown size={18} />}
            tone="danger"
            label="Expenses"
            value={formatCurrency(totalExpenses)}
            valueClassName="text-danger"
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
          <div className="flex items-center justify-between">
            <Link
              href={`/calendar?year=${prev.year}&month=${prev.month}`}
              aria-label="Previous month"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted transition-colors hover:text-foreground"
            >
              <ChevronLeft size={18} />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{monthLabel}</span>
              {!isCurrentMonth ? (
                <Link
                  href="/calendar"
                  className="rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-semibold text-primary"
                >
                  Today
                </Link>
              ) : null}
            </div>
            <Link
              href={`/calendar?year=${next.year}&month=${next.month}`}
              aria-label="Next month"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted transition-colors hover:text-foreground"
            >
              <ChevronRight size={18} />
            </Link>
          </div>

          <CalendarGrid year={year} month={month} eventsByDate={eventsByDate} todayKey={todayKey} />
        </div>
      </div>

      <BottomNav />
    </Screen>
  );
}
