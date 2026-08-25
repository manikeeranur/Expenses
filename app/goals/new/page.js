"use client";

import { useActionState, useState } from "react";
import Screen from "@/components/Screen";
import ScreenHeader from "@/components/ScreenHeader";
import { createGoal } from "@/lib/actions/goals";

const ICONS = [
  { icon: "ShieldCheck", color: "#6C5CE7" },
  { icon: "Laptop", color: "#3AA0FF" },
  { icon: "Plane", color: "#F5A623" },
  { icon: "Home", color: "#21C37E" },
  { icon: "PiggyBank", color: "#F2555A" },
];

export default function NewGoalPage() {
  const [state, action, pending] = useActionState(createGoal, undefined);
  const [selected, setSelected] = useState(ICONS[0]);

  return (
    <Screen withNav={false}>
      <ScreenHeader title="New Goal" />

      <form action={action} className="space-y-4 px-5 pt-4">
        <div>
          <label className="text-xs font-medium text-muted">Goal Name</label>
          <input
            name="name"
            type="text"
            placeholder="e.g. New Laptop"
            required
            className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted">Target Amount</label>
          <input
            name="target"
            type="number"
            min="1"
            step="0.01"
            placeholder="50000"
            required
            className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted">Target Date</label>
          <input
            name="dueDate"
            type="date"
            required
            className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted">Icon</label>
          <div className="mt-1.5 flex gap-2">
            {ICONS.map((opt) => (
              <button
                key={opt.icon}
                type="button"
                onClick={() => setSelected(opt)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-colors"
                style={{ backgroundColor: opt.color, borderColor: selected.icon === opt.icon ? "var(--color-foreground)" : "transparent" }}
                aria-label={opt.icon}
              />
            ))}
          </div>
        </div>
        <input type="hidden" name="icon" value={selected.icon} />
        <input type="hidden" name="color" value={selected.color} />

        {state?.error ? <p className="text-xs font-medium text-danger">{state.error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create Goal"}
        </button>
      </form>
    </Screen>
  );
}
