"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { X, Check, Copy } from "lucide-react";
import QrPattern from "@/components/upi/QrPattern";
import { receiveMoney } from "@/lib/actions/upi";
import { formatCurrency } from "@/lib/format";

export default function ReceiveMoneyFlow({ contacts, myUpiId }) {
  const [tab, setTab] = useState("log");
  const [copied, setCopied] = useState(false);
  const [payerName, setPayerName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [state, formAction, pending] = useActionState(receiveMoney, undefined);

  function copyUpiId() {
    navigator.clipboard?.writeText(myUpiId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (state?.success) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success-light">
          <Check size={36} className="text-success" />
        </span>
        <p className="mt-5 text-2xl font-bold">{formatCurrency(state.amount)}</p>
        <p className="mt-1 text-sm text-muted">Received from {state.payerName}</p>
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
        <h1 className="text-lg font-bold">Receive Money</h1>
        <Link href="/pay" aria-label="Cancel" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface">
          <X size={16} />
        </Link>
      </div>

      <div className="mt-5 flex rounded-2xl bg-surface p-1 shadow-sm shadow-black/[0.03]">
        {[
          { id: "log", label: "Log Received" },
          { id: "qr", label: "My QR Code" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              tab === t.id ? "bg-primary text-white" : "text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "qr" ? (
        <div className="mt-8 flex flex-col items-center">
          <QrPattern seed={myUpiId} size={200} />
          <p className="mt-5 text-sm font-semibold">{myUpiId}</p>
          <button
            type="button"
            onClick={copyUpiId}
            className="mt-3 flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium"
          >
            <Copy size={13} />
            {copied ? "Copied" : "Copy UPI ID"}
          </button>
          <p className="mt-6 max-w-xs text-center text-xs text-muted">
            Share this UPI ID or QR code so someone can pay you. Once they pay, log it under &ldquo;Log Received&rdquo; to track it here.
          </p>
        </div>
      ) : (
        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="payerName" value={payerName} />
          <input type="hidden" name="upiId" value={upiId} />
          <input type="hidden" name="amount" value={amount} />
          <input type="hidden" name="note" value={note} />

          {contacts.length ? (
            <div>
              <p className="mb-2 text-xs font-medium text-muted">Recent</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {contacts.map((c) => (
                  <button
                    key={c.upiId}
                    type="button"
                    onClick={() => {
                      setPayerName(c.name);
                      setUpiId(c.upiId);
                    }}
                    className="flex shrink-0 flex-col items-center gap-1.5"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success-light text-sm font-bold text-success">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="max-w-[64px] truncate text-[11px] text-muted">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <label className="text-xs font-medium text-muted">Received From</label>
            <input
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              type="text"
              placeholder="Name"
              className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted">UPI ID (optional)</label>
            <input
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              type="text"
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
              type="text"
              placeholder="What's it for?"
              className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
            />
          </div>

          {state?.error ? <p className="text-xs font-medium text-danger">{state.error}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center rounded-2xl bg-success py-3.5 text-sm font-semibold text-white shadow-lg shadow-success/25 disabled:opacity-60"
          >
            {pending ? "Saving..." : "Confirm Received"}
          </button>
        </form>
      )}
    </div>
  );
}
