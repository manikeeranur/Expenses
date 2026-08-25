"use client";

import { useActionState, useState } from "react";

export default function ContributionForm({ action, color }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-semibold text-white shadow-lg"
        style={{ backgroundColor: color }}
      >
        Add Contribution
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-2">
      <div className="flex items-center gap-2">
        <input
          name="amount"
          type="number"
          min="1"
          step="0.01"
          autoFocus
          placeholder="Amount"
          required
          className="flex-1 rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
          style={{ backgroundColor: color }}
        >
          {pending ? "Adding..." : "Add"}
        </button>
      </div>
      {state?.error ? <p className="text-xs font-medium text-danger">{state.error}</p> : null}
    </form>
  );
}
