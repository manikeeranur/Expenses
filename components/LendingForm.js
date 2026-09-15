"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import Modal from "@/components/ui/Modal";
import AmountInput from "@/components/ui/AmountInput";

export default function LendingForm({ action, defaults, variant = "pill" }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (prevState, formData) => {
    const result = await action(prevState, formData);
    if (result?.success) setOpen(false);
    return result;
  }, undefined);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "menu"
            ? "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-background"
            : "flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-semibold shadow-sm shadow-black/5"
        }
      >
        <Pencil size={variant === "menu" ? 15 : 13} className={variant === "menu" ? "text-muted" : undefined} />
        {variant === "menu" ? "Edit Entry" : "Edit"}
      </button>

      {open ? (
        <Modal title="Edit Lending Entry" onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted">Lent To</label>
              <input
                name="borrower"
                type="text"
                defaultValue={defaults?.borrower || ""}
                required
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Mobile Number</label>
              <input
                name="mobile"
                type="tel"
                inputMode="numeric"
                defaultValue={defaults?.mobile || ""}
                required
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Principal Amount (Asal)</label>
              <AmountInput
                name="principal"
                defaultValue={defaults?.principal}
                required
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Date Given</label>
              <input
                name="dateGiven"
                type="date"
                defaultValue={defaults?.dateGiven ? defaults.dateGiven.slice(0, 10) : ""}
                required
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
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
                  defaultValue={defaults?.interestRatePercent ?? ""}
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Interest Due Day</label>
                <input
                  name="interestDueDay"
                  type="number"
                  min="1"
                  max="31"
                  defaultValue={defaults?.interestDueDay ?? ""}
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Note</label>
              <input
                name="note"
                type="text"
                defaultValue={defaults?.note || ""}
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            {state?.error ? <p className="text-xs font-medium text-danger">{state.error}</p> : null}

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60"
            >
              {pending ? "Saving..." : "Save"}
            </button>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
