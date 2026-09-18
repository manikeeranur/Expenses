"use client";

import { useActionState, useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { X, Check, Camera, KeyRound, Copy } from "lucide-react";
import QRCode from "qrcode";
import UpiQrScanner from "@/components/upi/UpiQrScanner";
import CategorySelect from "@/components/ui/CategorySelect";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initiateUpiPayment, confirmUpiPayment } from "@/lib/actions/upi-pay";
import { parseUpiUri, isValidUpiId } from "@/lib/upi";
import { formatCurrency } from "@/lib/format";
import { useMounted } from "@/lib/useMounted";

export default function PayViaUpiFlow({ categories }) {
  const mounted = useMounted();
  const isMobile = mounted && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const [step, setStep] = useState("scan"); // scan, manual, details, confirm, awaiting
  const [payeeUpi, setPayeeUpi] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?._id || "");
  const [scanError, setScanError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [confirming, startConfirm] = useTransition();
  const [confirmError, setConfirmError] = useState(null);
  const [finalStatus, setFinalStatus] = useState(null);

  const [initState, initiateAction, initiating] = useActionState(initiateUpiPayment, undefined);

  const handleScan = useCallback((text) => {
    const parsed = parseUpiUri(text);
    if (!parsed) {
      setScanError("That QR doesn't look like a UPI payment code. Try again or enter details manually.");
      return;
    }
    setPayeeUpi(parsed.pa);
    setPayeeName(parsed.pn || "");
    if (parsed.am) setAmount(String(parsed.am));
    if (parsed.tn) setNote(parsed.tn);
    setScanError("");
    setStep("details");
  }, []);

  const awaitingConfirmation = Boolean(initState?.success);

  // A successful initiate means the transaction row already exists in the
  // database with status "initiated". Redirecting to the UPI app never marks
  // it paid on its own — that only happens once the user answers below.
  useEffect(() => {
    if (!initState?.success || !isMobile) return;
    window.location.href = initState.upiUri;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initState]);

  useEffect(() => {
    if (!awaitingConfirmation || !initState?.upiUri) return;
    QRCode.toDataURL(initState.upiUri, { margin: 1, width: 220 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [awaitingConfirmation, initState]);

  function resolvePayment(status) {
    setConfirmError(null);
    startConfirm(async () => {
      const res = await confirmUpiPayment(initState.transactionId, status);
      if (res?.error) setConfirmError(res.error);
      else setFinalStatus(status);
    });
  }

  const canContinueManual = isValidUpiId(payeeUpi.trim());
  const canContinueDetails = amount && Number(amount) > 0;

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-6 md:pt-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Pay via UPI</h1>
        <Link href="/transactions" aria-label="Cancel" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface">
          <X size={16} />
        </Link>
      </div>

      {step === "scan" ? (
        <div className="mt-6 space-y-4">
          <UpiQrScanner onScan={handleScan} />
          {scanError ? <p className="text-xs font-medium text-danger">{scanError}</p> : null}
          <button
            type="button"
            onClick={() => setStep("manual")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-semibold"
          >
            <KeyRound size={15} /> Enter UPI ID manually
          </button>
        </div>
      ) : null}

      {step === "manual" ? (
        <div className="mt-6 space-y-4">
          <div>
            <Label>Payee UPI ID</Label>
            <Input value={payeeUpi} onChange={(e) => setPayeeUpi(e.target.value)} placeholder="name@bank" />
          </div>
          <div>
            <Label>Payee Name (optional)</Label>
            <Input value={payeeName} onChange={(e) => setPayeeName(e.target.value)} placeholder="Who are you paying?" />
          </div>
          <button
            type="button"
            onClick={() => setStep("scan")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-semibold"
          >
            <Camera size={15} /> Scan QR code instead
          </button>
          <button
            type="button"
            disabled={!canContinueManual}
            onClick={() => setStep("details")}
            className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      ) : null}

      {step === "details" ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-surface p-3 text-sm">
            Paying <span className="font-semibold">{payeeName || payeeUpi}</span>
            <span className="block text-xs text-muted">{payeeUpi}</span>
          </div>
          <div>
            <Label>Amount</Label>
            <div className="flex items-center gap-1 rounded-2xl border border-border bg-background px-4 py-3 focus-within:border-primary">
              <span className="text-sm text-muted">₹</span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                min="1"
                step="0.01"
                placeholder="0"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>
          <div>
            <Label>Category</Label>
            <CategorySelect categories={categories} defaultValue={categoryId} onValueChange={setCategoryId} />
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's it for?" />
          </div>
          <button
            type="button"
            disabled={!canContinueDetails}
            onClick={() => setStep("confirm")}
            className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            Review Payment
          </button>
        </div>
      ) : null}

      {step === "confirm" && !awaitingConfirmation ? (
        <form action={initiateAction} className="mt-6 space-y-4">
          <input type="hidden" name="payeeUpiId" value={payeeUpi} />
          <input type="hidden" name="payeeName" value={payeeName} />
          <input type="hidden" name="amount" value={amount} />
          <input type="hidden" name="note" value={note} />
          <input type="hidden" name="categoryId" value={categoryId} />

          <div className="rounded-2xl bg-surface p-5 shadow-sm shadow-black/[0.03]">
            <p className="text-center text-xs text-muted">You&apos;re paying</p>
            <p className="mt-1 text-center text-3xl font-bold">{formatCurrency(Number(amount) || 0)}</p>
            <div className="mt-5 space-y-2.5">
              <ConfirmRow label="Payee" value={payeeName || payeeUpi} />
              <ConfirmRow label="UPI ID" value={payeeUpi} />
              <ConfirmRow label="Category" value={categories.find((c) => c._id === categoryId)?.name || "Uncategorized"} />
              {note ? <ConfirmRow label="Note" value={note} /> : null}
            </div>
          </div>

          {initState?.error ? <p className="text-xs font-medium text-danger">{initState.error}</p> : null}

          <p className="text-xs text-muted">
            This opens your UPI app to complete the payment. It&apos;s only recorded as Paid once you confirm it went through —
            opening the app alone doesn&apos;t count.
          </p>

          <button
            type="submit"
            disabled={initiating}
            className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60"
          >
            {initiating ? "Preparing…" : `Pay ${formatCurrency(Number(amount) || 0)} via UPI`}
          </button>
        </form>
      ) : null}

      {awaitingConfirmation ? (
        <div className="mt-10 flex flex-col items-center text-center">
          {finalStatus ? (
            <>
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full ${
                  finalStatus === "paid" ? "bg-success-light" : "bg-danger-light"
                }`}
              >
                <Check size={28} className={finalStatus === "paid" ? "text-success" : "text-danger"} />
              </span>
              <p className="mt-4 text-lg font-bold">{finalStatus === "paid" ? "Marked as Paid" : "Marked as Cancelled"}</p>
              <p className="mt-1 text-sm text-muted">Reference {initState.reference}</p>
              <Link
                href="/transactions"
                className="mt-8 flex w-full max-w-xs items-center justify-center rounded-2xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25"
              >
                Back to Transactions
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">{isMobile ? "Opened your UPI app for" : "Ready to pay"}</p>
              <p className="mt-1 text-2xl font-bold">{formatCurrency(initState.amount)}</p>
              <p className="mt-1 text-sm text-muted">to {initState.payeeName}</p>

              {!isMobile ? (
                <div className="mt-6 flex w-full flex-col items-center gap-3 rounded-2xl border border-border p-4">
                  <p className="text-xs text-muted">
                    UPI apps can&apos;t open from a desktop browser. Scan this with your phone to complete the payment.
                  </p>
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrDataUrl} alt="UPI payment QR code" width={200} height={200} className="rounded-xl" />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(initState.upiUri)}
                    className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold"
                  >
                    <Copy size={13} /> Copy UPI Link
                  </button>
                </div>
              ) : null}

              <p className="mt-8 text-xs font-medium text-muted">Did the payment go through?</p>
              {confirmError ? <p className="mt-2 text-xs font-medium text-danger">{confirmError}</p> : null}
              <div className="mt-3 flex w-full max-w-xs gap-3">
                <button
                  type="button"
                  disabled={confirming}
                  onClick={() => resolvePayment("paid")}
                  className="flex-1 rounded-2xl bg-success py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Yes, Payment Completed
                </button>
                <button
                  type="button"
                  disabled={confirming}
                  onClick={() => resolvePayment("cancelled")}
                  className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold disabled:opacity-60"
                >
                  No, Cancelled
                </button>
              </div>

              {isMobile ? (
                <button
                  type="button"
                  onClick={() => (window.location.href = initState.upiUri)}
                  className="mt-4 text-xs font-semibold text-primary"
                >
                  Didn&apos;t open? Try again
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ConfirmRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="max-w-[60%] truncate text-right font-medium">{value}</span>
    </div>
  );
}
