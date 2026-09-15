"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import Modal from "@/components/ui/Modal";
import AmountInput from "@/components/ui/AmountInput";

export default function EditPaymentForm({ action, defaults }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(defaults.type);
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
        aria-label="Edit payment"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-primary-light hover:text-primary"
      >
        <Pencil size={14} />
      </button>

      {open ? (
        <Modal title="Edit Payment" onClose={() => setOpen(false)}>
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
                defaultValue={defaults.date ? defaults.date.slice(0, 10) : ""}
                required
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Amount</label>
              <AmountInput
                name="amount"
                defaultValue={defaults.amount}
                required
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Payment Method</label>
              <select
                name="method"
                defaultValue={defaults.method || "cash"}
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
                defaultValue={defaults.remarks || ""}
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
              {pending ? "Saving..." : "Save"}
            </button>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
