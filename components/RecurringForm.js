"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";

const FREQUENCIES = ["Weekly", "Monthly", "Yearly"];

export default function RecurringForm({ action, categories }) {
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
        aria-label="Add recurring payment"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/25"
      >
        <Plus size={18} />
      </button>

      {open ? (
        <Modal title="Add Recurring Payment" onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-3">
            <input
              name="name"
              type="text"
              placeholder="Name (e.g. Netflix)"
              required
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
            />
            <select
              name="categoryId"
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              name="amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="Amount"
              required
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
            />
            <select
              name="frequency"
              defaultValue="Monthly"
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <input
              name="nextDate"
              type="date"
              required
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
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
