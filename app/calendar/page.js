import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import CalendarGrid from "@/components/CalendarGrid";
import { requireUserId } from "@/lib/session";
import { getCalendarEventsForMonth } from "@/lib/data";

export default async function CalendarPage({ searchParams }) {
  const userId = await requireUserId();
  const params = await searchParams;
  const now = new Date();
  const year = Number(params?.year) || now.getFullYear();
  const month = params?.month !== undefined ? Number(params.month) : now.getMonth();

  const eventsByDate = await getCalendarEventsForMonth(userId, year, month);
  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const prev = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const next = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
  const todayKey = now.toISOString().slice(0, 10);

  return (
    <Screen wide>
      <header className="px-4 pb-2 pt-6 md:hidden">
        <h1 className="text-xl font-bold">Calendar</h1>
      </header>

      <div className="px-4 pt-3">
        <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
          <div className="flex items-center justify-between">
            <Link href={`/calendar?year=${prev.year}&month=${prev.month}`} aria-label="Previous month" className="text-muted">
              <ChevronLeft size={18} />
            </Link>
            <span className="text-sm font-semibold">{monthLabel}</span>
            <Link href={`/calendar?year=${next.year}&month=${next.month}`} aria-label="Next month" className="text-muted">
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
