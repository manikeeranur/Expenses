"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Pencil } from "lucide-react";
import CategoryIcon from "@/components/ui/CategoryIcon";
import DeleteButton from "@/components/ui/DeleteButton";
import { formatCurrency, formatDate } from "@/lib/format";
import { deleteTransaction } from "@/lib/actions/transactions";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pad(n) {
  return String(n).padStart(2, "0");
}

export default function CalendarGrid({ year, month, eventsByDate, todayKey }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const [selected, setSelected] = useState(eventsByDate[todayKey] ? todayKey : null);

  const cells = [...Array.from({ length: firstDay }, () => null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const events = selected ? eventsByDate[selected] || [] : [];
  const dayTotal = events.reduce((s, e) => s + (e.type === "income" ? e.amount : -e.amount), 0);

  return (
    <>
      <div className="mt-4 grid grid-cols-7 gap-y-2 text-center text-[11px] text-muted">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-y-2 text-center">
        {cells.map((day, i) => {
          if (!day) return <span key={i} />;
          const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`;
          const hasEvent = !!eventsByDate[dateKey];
          const isSelected = dateKey === selected;
          const isToday = dateKey === todayKey;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(dateKey)}
              className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                isSelected ? "bg-primary text-white" : isToday ? "border border-primary text-primary" : "text-foreground hover:bg-background"
              }`}
            >
              {day}
              {hasEvent && !isSelected ? <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary" /> : null}
            </button>
          );
        })}
      </div>

      {selected ? (
        <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
              <CalendarDays size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold">{formatDate(selected)}</h2>
              {events.length ? <p className="text-[11px] text-muted">{events.length} transaction{events.length > 1 ? "s" : ""}</p> : null}
            </div>
            {events.length ? (
              <span className={`text-sm font-bold ${dayTotal >= 0 ? "text-success" : "text-danger"}`}>
                {dayTotal >= 0 ? "+" : "-"}
                {formatCurrency(Math.abs(dayTotal))}
              </span>
            ) : null}
          </div>

          {events.length ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-[11px] font-medium text-muted">Category</th>
                    <th className="pb-2 text-right text-[11px] font-medium text-muted">Amount</th>
                    <th className="pb-2 text-right text-[11px] font-medium text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {events.map((e) => {
                    const isIncome = e.type === "income";
                    return (
                      <tr key={e._id}>
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <CategoryIcon
                              icon={isIncome ? "Landmark" : e.category?.icon}
                              color={isIncome ? "#21C37E" : e.category?.color || "#9AA0B4"}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{e.title}</p>
                              <p className="truncate text-[11px] text-muted">{isIncome ? "Income" : e.category?.name || "Uncategorized"}</p>
                            </div>
                          </div>
                        </td>
                        <td className={`py-3 text-right text-sm font-semibold ${isIncome ? "text-success" : "text-danger"}`}>
                          {isIncome ? "+" : "-"}
                          {formatCurrency(e.amount)}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/transactions/${e._id}/edit`}
                              aria-label="Edit transaction"
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-primary-light hover:text-primary"
                            >
                              <Pencil size={14} />
                            </Link>
                            <DeleteButton
                              action={deleteTransaction.bind(null, e._id)}
                              variant="outline"
                              label="Delete transaction"
                              confirmText="Delete this transaction?"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 rounded-xl bg-background p-4 text-center text-xs text-muted">
              No transactions on this day.
            </p>
          )}
        </div>
      ) : null}
    </>
  );
}
