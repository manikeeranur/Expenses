"use client";

import { useActionState, useState } from "react";
import { Plus, Wallet } from "lucide-react";
import Modal from "@/components/ui/Modal";
import AmountInput from "@/components/ui/AmountInput";
import DatePicker from "@/components/ui/DatePicker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
              <Label>Paid Date</Label>
              <DatePicker name="date" required />
            </div>

            <div>
              <Label>Amount</Label>
              <AmountInput
                name="amount"
                placeholder="1,500.00"
                required
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
              />
            </div>

            <div>
              <Label>Payment Method</Label>
              <Select name="method" defaultValue="cash">
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Remarks</Label>
              <Input name="remarks" type="text" placeholder="Optional" />
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
