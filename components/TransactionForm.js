"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { X, Calendar, Landmark, Wallet, FileText, Tag as TagIcon } from "lucide-react";
import CategoryIcon from "@/components/ui/CategoryIcon";

const PAYMENT_METHODS = ["UPI", "Debit Card", "Credit Card", "Bank Transfer", "Cash", "Net Banking"];

export default function TransactionForm({
  action,
  categories,
  accounts,
  defaults,
  cancelHref,
  onCancel,
  submitLabel,
  hideHeader = false,
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [type, setType] = useState(defaults?.type || "expense");
  const [categoryId, setCategoryId] = useState(defaults?.categoryId || categories[0]?._id || "");
  const [tagsInput, setTagsInput] = useState(defaults?.tags?.join(", ") || "");

  const selectedCategory = categories.find((c) => c._id === categoryId);
  const today = new Date().toISOString().slice(0, 10);

  // Inside a modal the surrounding box is already bg-surface, so fields use
  // bg-background + a border instead of bg-surface + shadow to stay visible.
  const fieldClass = hideHeader
    ? "flex w-full items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3.5 text-left"
    : "flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 text-left shadow-sm shadow-black/[0.03]";
  const boxClass = hideHeader
    ? "rounded-2xl border border-border bg-background p-4"
    : "rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]";
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
        <input
          name="title"
          type="text"
          defaultValue={defaults?.title || ""}
          placeholder="What was this for?"
          required
          className={
            hideHeader
              ? "w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-sm outline-none placeholder:text-muted"
              : "w-full rounded-2xl bg-surface px-4 py-3.5 text-sm shadow-sm shadow-black/[0.03] outline-none placeholder:text-muted"
          }
        />
      </div>

      <div className={`mt-4 ${hideHeader ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}`}>
        {type === "expense" && (
          <label className={fieldClass}>
            {selectedCategory ? (
              <CategoryIcon icon={selectedCategory.icon} color={selectedCategory.color} size="sm" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted">Category</span>
              <select
                name="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-transparent text-sm font-medium outline-none"
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </span>
          </label>
        )}

        <label className={fieldClass}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light">
            <Calendar size={16} className="text-primary" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-muted">Date</span>
            <input
              name="date"
              type="date"
              defaultValue={defaults?.date || today}
              required
              className="w-full bg-transparent text-sm font-medium outline-none"
            />
          </span>
        </label>

        {!hideHeader ? (
          <label className={fieldClass}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light">
              <Landmark size={16} className="text-primary" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted">Account</span>
              <select
                name="accountId"
                defaultValue={defaults?.accountId || accounts[0]?._id || ""}
                className="w-full bg-transparent text-sm font-medium outline-none"
              >
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </span>
          </label>
        ) : null}

        <label className={fieldClass}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light">
            <Wallet size={16} className="text-primary" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-muted">Payment Method</span>
            <select
              name="method"
              defaultValue={defaults?.method || PAYMENT_METHODS[0]}
              className="w-full bg-transparent text-sm font-medium outline-none"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </span>
        </label>
      </div>

      <div className={hideHeader ? "mt-3" : "mt-3 space-y-3"}>
        {!hideHeader ? (
          <div className={boxClass}>
            <span className="flex items-center gap-2 text-xs text-muted">
              <FileText size={14} /> Description
            </span>
            <textarea
              name="description"
              rows={2}
              defaultValue={defaults?.description || ""}
              placeholder="Add a note"
              className="mt-2 w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
        ) : null}

        <div className={boxClass}>
          <span className="flex items-center gap-2 text-xs text-muted">
            <TagIcon size={14} /> Tags
          </span>
          <input
            name="tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Personal, Food (comma separated)"
            className="mt-2 w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
      </div>

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
