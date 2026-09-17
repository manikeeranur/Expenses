"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";
import CategorySelect from "@/components/ui/CategorySelect";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const PAYMENT_METHODS = ["UPI", "Debit Card", "Credit Card", "Bank Transfer", "Cash", "Net Banking"];

export default function TransactionForm({
  action,
  categories,
  accounts,
  defaults,
  cancelHref,
  onCancel,
  onSuccess,
  successHref,
  submitLabel,
  hideHeader = false,
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, undefined);
  const [type, setType] = useState(defaults?.type || "expense");
  const [tagsInput, setTagsInput] = useState(defaults?.tags?.join(", ") || "");

  useEffect(() => {
    if (!state?.success) return;
    onSuccess?.();
    if (successHref) router.push(successHref);
  }, [state]);

  const today = new Date().toISOString().slice(0, 10);

  const stripClass = hideHeader
    ? "flex rounded-2xl border border-border bg-background p-1"
    : "flex rounded-2xl bg-surface p-1 shadow-sm shadow-black/[0.03]";

  return (
    <form action={formAction} className={hideHeader ? "" : "px-5 pb-10 pt-6"}>
      {!hideHeader ? (
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">{submitLabel === "Save Changes" ? "Edit Transaction" : "Add Transaction"}</h1>
          {cancelHref ? (
            <Link href={cancelHref} aria-label="Cancel" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface">
              <X size={16} />
            </Link>
          ) : (
            <button type="button" onClick={onCancel} aria-label="Cancel" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface">
              <X size={16} />
            </button>
          )}
        </div>
      ) : null}

      <div className={`${stripClass} ${hideHeader ? "" : "mt-5"}`}>
        {["expense", "income"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold capitalize transition-colors ${
              type === t ? (t === "expense" ? "bg-danger text-white" : "bg-success text-white") : "text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <input type="hidden" name="type" value={type} />

      <div className={`text-center ${hideHeader ? "mt-5" : "mt-6"}`}>
        <div className="flex items-center justify-center gap-1 text-3xl font-bold">
          <span className="text-muted">₹</span>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults?.amount || ""}
            placeholder="0"
            required
            inputMode="decimal"
            className="w-40 bg-transparent text-center outline-none"
          />
        </div>
      </div>

      <div className="mt-4">
        <Label>Title</Label>
        <Input name="title" type="text" defaultValue={defaults?.title || ""} placeholder="What was this for?" required />
      </div>

      <div className="mt-4 space-y-4">
        {type === "expense" && (
          <div>
            <Label>Category</Label>
            <CategorySelect categories={categories} defaultValue={defaults?.categoryId} />
          </div>
        )}

        <div>
          <Label>Date</Label>
          <DatePicker name="date" defaultValue={defaults?.date || today} required />
        </div>

        {!hideHeader ? (
          <div>
            <Label>Account</Label>
            <Select name="accountId" defaultValue={defaults?.accountId || accounts[0]?._id || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a._id} value={a._id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div>
          <Label>Payment Method</Label>
          <Select name="method" defaultValue={defaults?.method || PAYMENT_METHODS[0]}>
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!hideHeader ? (
        <div className="mt-4 space-y-4">
          <div>
            <Label>Description</Label>
            <Textarea name="description" rows={2} defaultValue={defaults?.description || ""} placeholder="Add a note" />
          </div>

          <div>
            <Label>Tags</Label>
            <Input
              name="tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Personal, Food (comma separated)"
            />
          </div>
        </div>
      ) : null}

      <div className={hideHeader ? "sticky bottom-0 -mx-5 -mb-5 mt-6 bg-surface px-5 pb-5 pt-3" : ""}>
        {state?.error ? <p className="mb-3 text-xs font-medium text-danger">{state.error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className={`flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60 ${hideHeader ? "" : "mt-6"}`}
        >
          {pending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
