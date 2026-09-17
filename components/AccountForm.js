"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import AmountInput from "@/components/ui/AmountInput";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const TYPES = ["Savings Account", "Salary Account", "Cash", "Credit Card"];
const COLORS = ["#6C5CE7", "#3AA0FF", "#21C37E", "#F5A623", "#F2555A"];

export default function AccountForm({ action }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(TYPES[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [state, formAction, pending] = useActionState(async (prevState, formData) => {
    const result = await action(prevState, formData);
    if (result?.success) setOpen(false);
    return result;
  }, undefined);

  const isBank = type !== "Cash";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Add account"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/25"
      >
        <Plus size={18} />
      </button>

      {open ? (
        <Modal title="Add Account" onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-4">
            <div>
              <Label>Account Name</Label>
              <Input name="name" type="text" placeholder="e.g. My HDFC Savings" required />
            </div>

            <div>
              <Label>Account Type</Label>
              <Select name="type" value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isBank ? (
              <>
                <div>
                  <Label>Bank Name</Label>
                  <Input name="bankName" type="text" placeholder="e.g. HDFC Bank" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Account Number</Label>
                    <Input name="accountNumber" type="text" inputMode="numeric" placeholder="Account number" />
                  </div>
                  <div>
                    <Label>IFSC Code</Label>
                    <Input name="ifsc" type="text" placeholder="IFSC code" className="uppercase" />
                  </div>
                </div>
              </>
            ) : null}

            <div>
              <Label>Current Balance</Label>
              <AmountInput
                name="balance"
                placeholder="Current balance"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
              />
            </div>

            <div>
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="h-8 w-8 rounded-full border-2"
                    style={{ backgroundColor: c, borderColor: color === c ? "var(--color-foreground)" : "transparent" }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
            <input type="hidden" name="color" value={color} />
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
