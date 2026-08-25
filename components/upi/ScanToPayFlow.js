"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { X, RefreshCw, Check } from "lucide-react";
import { createQrCode, fetchQrPayments, closeQrCode } from "@/lib/actions/payments";
import { formatCurrency, formatDate } from "@/lib/format";

export default function ScanToPayFlow({ activeQr, payments }) {
  const [createState, createAction, creating] = useActionState(createQrCode, undefined);
  const [checking, startChecking] = useTransition();
  const [checkMessage, setCheckMessage] = useState(null);
  const [closing, startClosing] = useTransition();
  const [closeMessage, setCloseMessage] = useState(null);

  const qr = createState?.success
    ? {
        razorpayQrCodeId: createState.qrCodeId,
        qrImageUrl: createState.qrImageUrl,
        _id: createState.qrDbId,
        note: createState.note,
        amount: createState.amount,
      }
    : activeQr;

  function handleCheck() {
    setCheckMessage(null);
    startChecking(async () => {
      const res = await fetchQrPayments(qr._id);
      if (res?.error) setCheckMessage(res.error);
      else setCheckMessage(res.newCount > 0 ? `${res.newCount} new payment${res.newCount > 1 ? "s" : ""} found!` : "No new payments yet.");
    });
  }

  function handleClose() {
    if (!confirm("Stop tracking this QR code in the app?")) return;
    startClosing(async () => {
      const res = await closeQrCode(qr._id);
      if (res?.warning) setCloseMessage(res.warning);
    });
  }

  return (
    <div className="px-5 pb-10 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Scan to Pay</h1>
        <Link href="/pay" aria-label="Cancel" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface">
          <X size={16} />
        </Link>
      </div>

      <p className="mt-2 text-xs text-muted">
        Real Razorpay UPI QR code — anyone can scan this with any UPI app to pay you. In test mode, use Razorpay&apos;s test tools to
        simulate a scan.
      </p>

      {closeMessage ? <p className="mt-3 rounded-2xl bg-warning-light p-3 text-xs text-warning">{closeMessage}</p> : null}

      {qr ? (
        <div className="mt-6 flex flex-col items-center">
          <div className="rounded-2xl bg-white p-3 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.qrImageUrl} alt="UPI QR code" width={220} height={220} />
          </div>
          {qr.amount ? <p className="mt-4 text-lg font-bold">{formatCurrency(qr.amount)}</p> : null}
          {qr.note ? <p className="mt-1 text-sm text-muted">{qr.note}</p> : null}

          {checkMessage ? <p className="mt-4 text-xs font-medium text-primary">{checkMessage}</p> : null}

          <div className="mt-5 flex w-full max-w-xs gap-3">
            <button
              type="button"
              onClick={handleCheck}
              disabled={checking}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60"
            >
              <RefreshCw size={14} className={checking ? "animate-spin" : ""} />
              {checking ? "Checking..." : "Check Payments"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={closing}
              className="flex-1 rounded-2xl border border-danger/30 bg-danger-light py-3 text-sm font-semibold text-danger disabled:opacity-60"
            >
              {closing ? "Closing..." : "Close QR"}
            </button>
          </div>

          {payments.length ? (
            <div className="mt-8 w-full">
              <h2 className="text-sm font-semibold">Received via this QR</h2>
              <div className="mt-3 space-y-2.5">
                {payments.map((p) => (
                  <div key={p._id} className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-sm shadow-black/[0.03]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success-light">
                      <Check size={16} className="text-success" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted">{formatDate(p.createdAt, { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <p className="text-sm font-semibold text-success">+{formatCurrency(p.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <form action={createAction} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted">Fixed Amount (optional)</label>
            <input
              name="amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="Leave blank to let payer enter any amount"
              className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Label (optional)</label>
            <input
              name="note"
              type="text"
              placeholder="e.g. Split dinner bill"
              className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
            />
          </div>

          {createState?.error ? <p className="text-xs font-medium text-danger">{createState.error}</p> : null}

          <button
            type="submit"
            disabled={creating}
            className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60"
          >
            {creating ? "Generating..." : "Generate QR Code"}
          </button>
        </form>
      )}
    </div>
  );
}
