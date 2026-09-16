"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { X, Check, IndianRupee } from "lucide-react";
import { createCheckoutOrder, verifyCheckoutPayment } from "@/lib/actions/payments";
import { formatCurrency } from "@/lib/format";

export default function AddMoneyFlow({ userName, userEmail }) {
  const [scriptReady, setScriptReady] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [orderState, createOrderAction, creatingOrder] = useActionState(createCheckoutOrder, undefined);
  const [verifyState, verifyAction, verifying] = useActionState(verifyCheckoutPayment, undefined);
  const [checkoutError, setCheckoutError] = useState(null);

  useEffect(() => {
    if (!orderState?.orderId || !scriptReady) return;

    const rzp = new window.Razorpay({
      key: orderState.keyId,
      amount: orderState.amount,
      currency: orderState.currency,
      name: "Monthly Expenses",
      description: orderState.note || "Add Money",
      order_id: orderState.orderId,
      prefill: { name: userName, email: userEmail },
      theme: { color: "#6C5CE7" },
      method: { upi: true, card: true, netbanking: true, wallet: false },
      handler: (response) => {
        const formData = new FormData();
        formData.set("razorpay_order_id", response.razorpay_order_id);
        formData.set("razorpay_payment_id", response.razorpay_payment_id);
        formData.set("razorpay_signature", response.razorpay_signature);
        formData.set("paymentDbId", orderState.paymentDbId);
        verifyAction(formData);
      },
      modal: {
        ondismiss: () => setCheckoutError("Payment cancelled."),
      },
    });

    rzp.on("payment.failed", (response) => {
      setCheckoutError(response.error?.description || "Payment failed.");
    });

    rzp.open();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderState, scriptReady]);

  if (verifyState?.success) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success-light">
          <Check size={36} className="text-success" />
        </span>
        <p className="mt-5 text-2xl font-bold">{formatCurrency(verifyState.amount)}</p>
        <p className="mt-1 text-sm text-muted">Added to your account — real payment via Razorpay</p>

        <div className="mt-8 flex w-full max-w-xs gap-3">
          <Link
            href={`/transactions/${verifyState.transactionId}`}
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
    <div className="mx-auto max-w-xl px-4 pb-10 pt-6 md:pt-10">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setScriptReady(true)} />

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Add Money</h1>
        <Link href="/pay" aria-label="Cancel" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface">
          <X size={16} />
        </Link>
      </div>

      <p className="mt-2 text-xs text-muted">
        Real payment via Razorpay (UPI, cards, netbanking) — in test mode, use Razorpay&apos;s test UPI ID / test cards, no real money moves.
      </p>

      <form action={createOrderAction} className="mt-6 space-y-4">
        <input type="hidden" name="amount" value={amount} />
        <input type="hidden" name="note" value={note} />

        <div>
          <label className="text-xs font-medium text-muted">Amount</label>
          <div className="mt-1.5 flex items-center gap-1 rounded-2xl border border-border bg-surface px-4 py-3 focus-within:border-primary">
            <IndianRupee size={14} className="text-muted" />
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

        {orderState?.error ? <p className="text-xs font-medium text-danger">{orderState.error}</p> : null}
        {verifyState?.error ? <p className="text-xs font-medium text-danger">{verifyState.error}</p> : null}
        {checkoutError ? <p className="text-xs font-medium text-danger">{checkoutError}</p> : null}

        <button
          type="submit"
          disabled={!scriptReady || creatingOrder || verifying || !amount}
          className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60"
        >
          {!scriptReady ? "Loading..." : creatingOrder ? "Starting payment..." : verifying ? "Verifying..." : "Pay with Razorpay"}
        </button>
      </form>
    </div>
  );
}
