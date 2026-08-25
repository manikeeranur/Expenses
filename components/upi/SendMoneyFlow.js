"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { X, ArrowUpRight, Check } from "lucide-react";
import PinPad from "@/components/upi/PinPad";
import { sendMoney } from "@/lib/actions/upi";
import { formatCurrency } from "@/lib/format";

export default function SendMoneyFlow({ contacts }) {
  const [step, setStep] = useState("details");
  const [payeeName, setPayeeName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");
  const formRef = useRef(null);
  const [state, formAction, pending] = useActionState(sendMoney, undefined);

  function pickContact(contact) {
    setPayeeName(contact.name);
    setUpiId(contact.upiId);
  }

  function goToPin(e) {
    e.preventDefault();
    if (!payeeName.trim()) return;
    if (!upiId.includes("@")) return;
    if (!amount || Number(amount) <= 0) return;
    setStep("pin");
  }

  function handlePinChange(next) {
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => formRef.current?.requestSubmit(), 150);
    }
  }

  if (state?.success) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success-light">
          <Check size={36} className="text-success" />
        </span>
        <p className="mt-5 text-2xl font-bold">{formatCurrency(state.amount)}</p>
        <p className="mt-1 text-sm text-muted">Sent to {state.payeeName}</p>
        <p className="mt-4 text-xs text-muted">UPI Ref No.</p>
        <p className="text-sm font-medium">{state.reference}</p>

        <div className="mt-8 flex w-full max-w-xs gap-3">
          <Link
            href={`/transactions/${state.transactionId}`}
            className="flex-1 rounded-2xl border border-border py-3 text-center text-sm font-semibold"
          >
            View Details
          </Link>
          <Link
            href="/pay"
            className="flex-1 rounded-2xl bg-primary py-3 text-center text-sm font-semibold text-white shadow-lg shadow-primary/25"
          >
            Done
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-10 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Send Money</h1>
        <Link href="/pay" aria-label="Cancel" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface">
          <X size={16} />
        </Link>
      </div>

      <form
        ref={formRef}
        action={formAction}
        onSubmit={(e) => {
          if (step !== "pin") e.preventDefault();
          else if (pin.length !== 4) e.preventDefault();
          else setStep("submitting");
        }}
      >
        <input type="hidden" name="payeeName" value={payeeName} />
        <input type="hidden" name="upiId" value={upiId} />
        <input type="hidden" name="amount" value={amount} />
        <input type="hidden" name="note" value={note} />
        <input type="hidden" name="pin" value={pin} />

        {step === "details" ? (
          <div className="mt-6 space-y-4">
            {contacts.length ? (
              <div>
                <p className="mb-2 text-xs font-medium text-muted">Recent</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {contacts.map((c) => (
                    <button
                      key={c.upiId}
                      type="button"
                      onClick={() => pickContact(c)}
                      className="flex shrink-0 flex-col items-center gap-1.5"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary-dark">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="max-w-[64px] truncate text-[11px] text-muted">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <label className="text-xs font-medium text-muted">Pay To</label>
              <input
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="Name"
                className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">UPI ID</label>
              <input
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="name@bank"
                className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Amount</label>
              <div className="mt-1.5 flex items-center gap-1 rounded-2xl border border-border bg-surface px-4 py-3 focus-within:border-primary">
                <span className="text-sm text-muted">₹</span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Note (optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's it for?"
                className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
              />
            </div>

            <button
              type="button"
              onClick={goToPin}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25"
            >
              <ArrowUpRight size={16} />
              Proceed to Pay
            </button>
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center">
            <p className="text-sm text-muted">Paying</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(Number(amount) || 0)}</p>
            <p className="mt-1 text-sm text-muted">to {payeeName}</p>

            <p className="mt-8 text-xs font-medium text-muted">Enter UPI PIN</p>
            <div className="mt-4">
              <PinPad value={pin} onChange={handlePinChange} />
            </div>

            {state?.error ? <p className="mt-4 text-xs font-medium text-danger">{state.error}</p> : null}
            {pending ? <p className="mt-4 text-xs text-muted">Processing payment…</p> : null}
          </div>
        )}
      </form>
    </div>
  );
}
