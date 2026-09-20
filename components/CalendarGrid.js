"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import CategoryIcon from "@/components/ui/CategoryIcon";
import TransactionActionsMenu from "@/components/TransactionActionsMenu";
import EditTransactionModal from "@/components/EditTransactionModal";
import { formatCurrency, formatDate } from "@/lib/format";
import { deleteTransaction } from "@/lib/actions/transactions";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function compactAmount(n) {
  const abs = Math.abs(n);
  if (abs >= 100000) return `${(abs / 100000).toFixed(1).replace(/\.0$/, "")}L`;
  if (abs >= 1000) return `${(abs / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${Math.round(abs)}`;
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

      <div className="mt-1 grid grid-cols-7 gap-1 text-center">
        {cells.map((day, i) => {
          if (!day) return <span key={i} />;
          const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`;
          const dayEvents = eventsByDate[dateKey];
          const hasEvent = !!dayEvents;
          const isSelected = dateKey === selected;
          const isToday = dateKey === todayKey;
          const dayNet = hasEvent ? dayEvents.reduce((s, e) => s + (e.type === "income" ? e.amount : -e.amount), 0) : 0;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(dateKey)}
              className={`mx-auto flex aspect-square w-full max-w-14 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-medium transition-colors ${
                isSelected ? "bg-primary text-white" : isToday ? "border border-primary text-primary" : "text-foreground hover:bg-background"
              }`}
            >
              <span>{day}</span>
              {hasEvent ? (
                <span
                  className={`text-[9px] font-semibold leading-none ${
                    isSelected ? "text-white/90" : dayNet >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {dayNet >= 0 ? "+" : "-"}
                  {compactAmount(dayNet)}
                </span>
              ) : null}
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
            <>
              {/* Card layout below md */}
              <div className="mt-3 space-y-2 md:hidden">
                {events.map((e) => {
                  const isIncome = e.type === "income";
                  return (
                    <div key={e._id} className="flex items-center gap-3 rounded-2xl bg-background p-3">
                      <CategoryIcon
                        icon={isIncome ? "Landmark" : e.categoryId?.icon}
                        color={isIncome ? "#21C37E" : e.categoryId?.color || "#9AA0B4"}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{e.title}</p>
                        <p className="truncate text-xs text-muted">{isIncome ? "Income" : e.categoryId?.name || "Uncategorized"}</p>
                      </div>
                      <span className={`shrink-0 text-sm font-semibold ${isIncome ? "text-success" : "text-danger"}`}>
                        {isIncome ? "+" : "-"}
                        {formatCurrency(e.amount)}
                      </span>
                      <TransactionActionsMenu
                        editSlot={<EditTransactionModal transaction={e} />}
                        deleteAction={deleteTransaction.bind(null, e._id)}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Table layout from md up */}
              <div className="mt-3 hidden overflow-x-auto md:block">
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
                                icon={isIncome ? "Landmark" : e.categoryId?.icon}
                                color={isIncome ? "#21C37E" : e.categoryId?.color || "#9AA0B4"}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{e.title}</p>
                                <p className="truncate text-[11px] text-muted">{isIncome ? "Income" : e.categoryId?.name || "Uncategorized"}</p>
                              </div>
                            </div>
                          </td>
                          <td className={`py-3 text-right text-sm font-semibold ${isIncome ? "text-success" : "text-danger"}`}>
                            {isIncome ? "+" : "-"}
                            {formatCurrency(e.amount)}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-end">
                              <TransactionActionsMenu
                                editSlot={<EditTransactionModal transaction={e} />}
                                deleteAction={deleteTransaction.bind(null, e._id)}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
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
