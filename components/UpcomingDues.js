import { CalendarClock } from "lucide-react";
import { formatCurrencyPrecise, formatDateShort } from "@/lib/format";

export default function UpcomingDues({ dues }) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
          <CalendarClock size={17} />
        </span>
        <h2 className="flex-1 text-sm font-bold">Upcoming Dues</h2>
      </div>

      {dues.length ? (
        <div className="mt-3 space-y-3">
          {dues.map((d) => {
            const overdue = d.diffDays < 0;
            return (
              <div key={d._id} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                  {d.borrower.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.borrower}</p>
                  <p className="text-xs text-muted">Monthly due</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold">{formatCurrencyPrecise(d.amount)}</p>
                  <p className="text-[11px] text-muted">{formatDateShort(d.due)}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${
                    overdue ? "bg-danger-light text-danger" : "bg-background text-muted"
                  }`}
                >
                  {overdue ? `Overdue ${Math.abs(d.diffDays)}d` : `${d.diffDays}d`}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-background p-4 text-center text-xs text-muted">No upcoming dues.</p>
      )}
    </div>
  );
}
