"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import DatePicker from "@/components/ui/DatePicker";
import CategorySelect from "@/components/ui/CategorySelect";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
          <form action={formAction} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input name="name" type="text" placeholder="Name (e.g. Netflix)" required />
            </div>

            <div>
              <Label>Category</Label>
              <CategorySelect categories={categories} />
            </div>

            <div>
              <Label>Amount</Label>
              <Input name="amount" type="number" min="1" step="0.01" placeholder="Amount" required />
            </div>

            <div>
              <Label>Frequency</Label>
              <Select name="frequency" defaultValue="Monthly">
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Next Date</Label>
              <DatePicker name="nextDate" required />
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
