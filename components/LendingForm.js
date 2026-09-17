"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import AmountInput from "@/components/ui/AmountInput";
import DatePicker from "@/components/ui/DatePicker";

const TRIGGER_CLASSNAME = {
  pill: "flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-semibold shadow-sm shadow-black/5",
  menu: "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-background",
  header: "hidden items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/25 md:flex",
  fab: "flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/25",
  empty: "mt-6 flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25",
};

export default function LendingForm({ action, defaults, variant = "pill", mode = "edit", className }) {
  const isCreate = mode === "create";
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (prevState, formData) => {
    const result = await action(prevState, formData);
    if (result?.success) setOpen(false);
    return result;
  }, undefined);

  const Icon = isCreate ? Plus : Pencil;
  const iconSize = variant === "fab" ? 18 : variant === "menu" ? 15 : 13;
  const triggerLabel = isCreate ? "Add Entry" : variant === "menu" ? "Edit Entry" : "Edit";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={variant === "fab" ? "Add lending entry" : undefined}
        className={`${TRIGGER_CLASSNAME[variant] || TRIGGER_CLASSNAME.pill} ${className || ""}`}
      >
        <Icon size={iconSize} className={variant === "menu" ? "text-muted" : undefined} />
        {variant === "fab" ? null : triggerLabel}
      </button>

      {open ? (
        <Modal title={isCreate ? "New Lending Entry" : "Edit Lending Entry"} onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted">Lent To</label>
              <input
                name="borrower"
                type="text"
                placeholder="e.g. Mugesh"
                defaultValue={defaults?.borrower || ""}
                required
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Mobile Number</label>
              <input
                name="mobile"
                type="tel"
                inputMode="numeric"
                placeholder="9876543210"
                defaultValue={defaults?.mobile || ""}
                required
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Principal Amount (Asal)</label>
              <AmountInput
                name="principal"
                placeholder="50,000.00"
                defaultValue={defaults?.principal}
                required
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Date Given</label>
              <DatePicker
                name="dateGiven"
                defaultValue={defaults?.dateGiven ? defaults.dateGiven.slice(0, 10) : ""}
                required
                className="mt-1.5"
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
                  defaultValue={defaults?.interestRatePercent ?? ""}
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
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
                  defaultValue={defaults?.interestDueDay ?? ""}
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Note</label>
              <input
                name="note"
                type="text"
                placeholder="Optional note"
                defaultValue={defaults?.note || ""}
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
              />
            </div>

            {state?.error ? <p className="text-xs font-medium text-danger">{state.error}</p> : null}

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60"
            >
              {pending ? "Saving..." : isCreate ? "Save Entry" : "Save"}
            </button>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
