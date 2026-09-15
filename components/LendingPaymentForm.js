"use client";

import { useActionState, useState } from "react";
import { Plus, Wallet } from "lucide-react";
import Modal from "@/components/ui/Modal";
import AmountInput from "@/components/ui/AmountInput";

export default function LendingPaymentForm({ action }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("interest");
  const [state, formAction, pending] = useActionState(async (prevState, formData) => {
    const result = await action(prevState, formData);
    if (result?.success) setOpen(false);
    return result;
  }, undefined);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/15 bg-primary-light/60 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-primary shadow-sm shadow-black/5">
          <Wallet size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Log a Payment</p>
          <p className="text-xs text-muted">Record a new interest or principal payment</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-primary/25"
        >
          <Plus size={14} />
          Log Payment
        </button>
      </div>

      {open ? (
        <Modal title="Log a Payment" onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("interest")}
                className={`flex-1 rounded-xl py-2 text-xs font-semibold ${type === "interest" ? "bg-primary-light text-primary-dark" : "bg-background text-muted"}`}
              >
                Interest
              </button>
              <button
                type="button"
                onClick={() => setType("principal")}
                className={`flex-1 rounded-xl py-2 text-xs font-semibold ${type === "principal" ? "bg-primary-light text-primary-dark" : "bg-background text-muted"}`}
              >
                Principal Repaid
              </button>
            </div>
            <input type="hidden" name="type" value={type} />

            <div>
              <label className="text-xs font-medium text-muted">Paid Date</label>
              <input
                name="date"
                type="date"
                required
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Amount</label>
              <AmountInput
                name="amount"
                placeholder="1,500.00"
                required
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Payment Method</label>
              <select
                name="method"
                defaultValue="cash"
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Remarks</label>
              <input
                name="remarks"
                type="text"
                placeholder="Optional"
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
              />
            </div>

            {state?.error ? <p className="text-xs font-medium text-danger">{state.error}</p> : null}

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60"
            >
              {pending ? "Saving..." : "Save Payment"}
            </button>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
