"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";

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
              className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                isSelected ? "bg-primary text-white" : isToday ? "text-primary" : "text-foreground"
              }`}
            >
              {day}
              {hasEvent && !isSelected ? <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary" /> : null}
            </button>
          );
        })}
      </div>

      {selected ? (
        <div className="mt-4">
          <h2 className="text-sm font-semibold">{formatDate(selected)}</h2>
          <div className="mt-3 space-y-2.5">
            {events.length ? (
              events.map((e, i) => (
                <div key={i} className="flex items-center justify-between rounded-2xl bg-surface p-3.5 shadow-sm shadow-black/[0.03]">
                  <span className="text-sm">{e.title}</span>
                  <span className={`text-sm font-semibold ${e.type === "income" ? "text-success" : "text-foreground"}`}>
                    {e.type === "income" ? "+" : "-"}
                    {formatCurrency(e.amount)}
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-surface p-4 text-center text-xs text-muted shadow-sm shadow-black/[0.03]">
                No transactions on this day.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
