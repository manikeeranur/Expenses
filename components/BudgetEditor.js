"use client";

import { useState, useTransition } from "react";
import { Pencil, Check } from "lucide-react";

export default function BudgetEditor({ action, currentBudget }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentBudget);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary"
      >
        <Pencil size={12} />
        Edit Budget
      </button>
    );
  }

  return (
    <form
      className="mt-3 flex items-center gap-2"
      action={(formData) => {
        startTransition(async () => {
          await action(formData);
          setEditing(false);
        });
      }}
    >
      <span className="text-xs text-muted">₹</span>
      <input
        name="budget"
        type="number"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
      />
      <button
        type="submit"
        disabled={pending}
        aria-label="Save budget"
        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white disabled:opacity-60"
      >
        <Check size={12} />
      </button>
    </form>
  );
}
