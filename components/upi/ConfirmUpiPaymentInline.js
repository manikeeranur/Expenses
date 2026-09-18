"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { confirmUpiPayment } from "@/lib/actions/upi-pay";

export default function ConfirmUpiPaymentInline({ transactionId }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [resolved, setResolved] = useState(null);
  const [note, setNote] = useState("");

  function resolve(status) {
    setError(null);
    startTransition(async () => {
      const res = await confirmUpiPayment(transactionId, status, note);
      if (res?.error) setError(res.error);
      else setResolved(status);
    });
  }

  if (resolved) {
    return (
      <p className="mt-3 text-xs font-medium text-muted">
        Marked as {resolved === "paid" ? "Paid" : "Cancelled"}. Refresh to see it reflected above.
      </p>
    );
  }

  return (
    <div className="mt-3 rounded-2xl bg-warning-light p-3">
      <p className="text-xs font-medium">Did this UPI payment go through?</p>
      <p className="mt-1 text-xs text-muted">This is self-reported — there&apos;s no bank confirmation behind it.</p>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="UTR/reference number, or reason if it failed (optional)"
        className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none placeholder:text-muted focus:border-primary"
      />
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => resolve("paid")}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-success py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          <Check size={13} /> Yes, Paid
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => resolve("cancelled")}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-border py-2 text-xs font-semibold disabled:opacity-60"
        >
          <X size={13} /> No, Cancelled
        </button>
      </div>
    </div>
  );
}
