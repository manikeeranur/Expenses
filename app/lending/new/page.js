"use client";

import { useActionState } from "react";
import Screen from "@/components/Screen";
import ScreenHeader from "@/components/ScreenHeader";
import AmountInput from "@/components/ui/AmountInput";
import { createLending } from "@/lib/actions/lending";

export default function NewLendingPage() {
  const [state, action, pending] = useActionState(createLending, undefined);

  return (
    <Screen withNav={false}>
      <ScreenHeader title="New Lending Entry" />

      <form action={action} className="space-y-4 px-5 pt-4">
        <div>
          <label className="text-xs font-medium text-muted">Lent To</label>
          <input
            name="borrower"
            type="text"
            placeholder="e.g. Mugesh"
            required
            className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted">Mobile Number</label>
          <input
            name="mobile"
            type="tel"
            inputMode="numeric"
            placeholder="9876543210"
            required
            className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted">Principal Amount (Asal)</label>
          <AmountInput
            name="principal"
            placeholder="50,000.00"
            required
            className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted">Date Given</label>
          <input
            name="dateGiven"
            type="date"
            required
            className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted">Interest Rate (% / month)</label>
            <input
              name="interestRatePercent"
              type="number"
              min="0"
              step="0.1"
              placeholder="3"
              className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Interest Due Day</label>
            <input
              name="interestDueDay"
              type="number"
              min="1"
              max="31"
              placeholder="21"
              className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted">Note</label>
          <input
            name="note"
            type="text"
            placeholder="Optional note"
            className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
          />
        </div>

        {state?.error ? <p className="text-xs font-medium text-danger">{state.error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save Entry"}
        </button>
      </form>
    </Screen>
  );
}
