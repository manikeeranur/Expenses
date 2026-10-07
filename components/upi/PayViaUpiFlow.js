"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { X, Check, Camera, KeyRound, Copy, Upload } from "lucide-react";
import jsQR from "jsqr";
import QRCode from "qrcode";
import UpiQrScanner from "@/components/upi/UpiQrScanner";
import CategorySelect from "@/components/ui/CategorySelect";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initiateUpiPayment, confirmUpiPayment, lookupPayeeName } from "@/lib/actions/upi-pay";
import {
  parseUpiUri,
  isValidUpiId,
  validateUpiUri,
  logUpiDebug,
  getAllUpiParams,
  sanitizeUpiText,
  finalizeScannedUpiUri,
  buildUpiUri,
  generateUpiReference,
  toCredPayUrl,
  UPI_DEBUG,
} from "@/lib/upi";
import { formatCurrency } from "@/lib/format";
import { useMounted } from "@/lib/useMounted";

// Scan → type the amount → "Pay" opens the CRED app directly with that exact
// amount, and the payment is made there. Only CRED: no Android app chooser,
// no Google Pay or any other UPI app — CRED's own URL scheme is handled by
// CRED alone (see toCredPayUrl in lib/upi.js).
const DEV = UPI_DEBUG;

function decodeQrFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read that image."));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        resolve(code?.data || null);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function PayViaUpiFlow({ categories }) {
  const mounted = useMounted();
  const isMobile = mounted && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const [step, setStep] = useState("scan"); // scan, manual, details
  const [payeeUpi, setPayeeUpi] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?._id || "");
  const [scanError, setScanError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [confirming, startConfirm] = useTransition();
  const [confirmError, setConfirmError] = useState(null);
  const [confirmNote, setConfirmNote] = useState("");
  const [finalStatus, setFinalStatus] = useState(null);
  // appOpened: user tapped Pay and the browser handed off to CRED.
  // returnedToTab: this page was hidden and then regained visibility (the
  // user switched back, either mid-payment or after finishing) — we still
  // can't tell which, hence PENDING not SUCCESS.
  const [appOpened, setAppOpened] = useState(false);
  const [returnedToTab, setReturnedToTab] = useState(false);
  const [launchError, setLaunchError] = useState(null);
  const [scannedUri, setScannedUri] = useState(null);
  const [amountLocked, setAmountLocked] = useState(false);
  // Made here, not on the server, so the CRED link opened in the Pay tap
  // carries the same tr as the record created in that same tap.
  const [reference, setReference] = useState("");
  // Bumped on every launch so the hand-off watcher below re-arms.
  const [launchCount, setLaunchCount] = useState(0);
  const fileInputRef = useRef(null);
  const payFormRef = useRef(null);

  const [initState, initiateAction, initiating] = useActionState(initiateUpiPayment, undefined);

  const handleScan = useCallback((text) => {
    if (DEV) console.log("ORIGINAL_QR_PAYLOAD", text);
    const parsed = parseUpiUri(text);
    if (!parsed) {
      logUpiDebug("scan:rejected", { originalQrPayload: text });
      setScanError("That QR doesn't look like a UPI payment code. Try again or enter details manually.");
      return;
    }
    logUpiDebug("scan:parsed", {
      originalQrPayload: text,
      parsedUpiUri: parsed.raw,
      pa: parsed.pa,
      pn: parsed.pn,
      am: parsed.am,
      cu: parsed.cu,
      tn: parsed.tn,
      tr: parsed.tr,
      mc: parsed.mc,
      // Every param the QR actually carries, including ones this app doesn't
      // otherwise use (mode, purpose, orgid, sign, refUrl, …) — see STEP 2.
      allParams: getAllUpiParams(parsed.raw),
    });
    setPayeeUpi(parsed.pa);
    setPayeeName(parsed.pn || "");
    if (parsed.am) setAmount(String(parsed.am));
    if (parsed.tn) setNote(parsed.tn);
    setScannedUri(parsed.raw);
    setAmountLocked(parsed.am != null);
    setScanError("");
    setReference(generateUpiReference());
    setStep("details");

    // The QR's own "pn" is often a generic aggregator/POS name, not the real
    // business name — if this UPI ID was renamed on a past payment, prefer
    // that over whatever this scan just gave us.
    lookupPayeeName(parsed.pa).then((res) => {
      if (res?.name) setPayeeName(res.name);
    });
  }, []);

  function goToManualEntry() {
    setScannedUri(null);
    setAmountLocked(false);
    setStep("manual");
  }

  async function continueFromManual() {
    const saved = await lookupPayeeName(payeeUpi.trim());
    if (saved?.name && !payeeName.trim()) setPayeeName(saved.name);
    setReference(generateUpiReference());
    setStep("details");
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await decodeQrFromFile(file);
      if (!text) {
        setScanError("Couldn't find a QR code in that image. Try another photo or enter details manually.");
        return;
      }
      handleScan(text);
    } catch {
      setScanError("Couldn't read that image. Try another photo or enter details manually.");
    }
  }

  const awaitingConfirmation = Boolean(initState?.success);

  // The same link initiateUpiPayment builds and stores (same lib/upi helpers,
  // same sanitizing, same reference), worked out here so the Pay tap can open
  // CRED immediately instead of waiting for the server to answer first.
  const launchUri = useMemo(() => {
    const scanned = sanitizeUpiText(scannedUri, 2000);
    if (scanned) return finalizeScannedUpiUri(scanned, { amount: Number(amount) });
    return buildUpiUri({
      payeeUpiId: sanitizeUpiText(payeeUpi, 100),
      payeeName: sanitizeUpiText(payeeName, 100),
      amount: Number(amount),
      note: sanitizeUpiText(note, 200),
      reference,
    });
  }, [scannedUri, payeeUpi, payeeName, amount, note, reference]);

  // The 7 states this flow can be in. Only INITIATED/APP_OPENED/PENDING are
  // ever inferred client-side — SUCCESS/CANCELLED come from the user's own
  // explicit answer, never assumed just because the UPI app opened (see
  // lib/upi.js for why the browser can't observe the real outcome).
  const paymentState = !awaitingConfirmation
    ? null
    : finalStatus === "paid"
      ? "SUCCESS"
      : finalStatus === "cancelled"
        ? "CANCELLED"
        : launchError
          ? "FAILED"
          : confirmError
            ? "UNKNOWN"
            : returnedToTab
              ? "PENDING"
              : appOpened
                ? "APP_OPENED"
                : "INITIATED";

  useEffect(() => {
    if (paymentState) logUpiDebug("state", paymentState);
  }, [paymentState]);

  useEffect(() => {
    if (!awaitingConfirmation || !initState?.upiUri) return;
    QRCode.toDataURL(initState.upiUri, { margin: 1, width: 220 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [awaitingConfirmation, initState]);

  // Watches the hand-off to CRED. If this page isn't hidden within a few
  // seconds of the tap, CRED didn't open (not installed, or blocked). Once
  // it has been hidden and comes back, the user has returned from CRED —
  // which still doesn't mean the payment succeeded, only that we can ask.
  useEffect(() => {
    if (!appOpened || finalStatus) return;
    let left = document.visibilityState === "hidden";
    function handleVisibility() {
      if (document.visibilityState === "hidden") {
        left = true;
      } else if (left) {
        setLaunchError(null);
        setReturnedToTab(true);
      }
    }
    const timer = setTimeout(() => {
      if (!left) setLaunchError("CRED didn't open. Check that the CRED app is installed and up to date, then try again.");
    }, 4000);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [appOpened, finalStatus, launchCount]);

  // Runs inside the Pay link's own click, without preventDefault: the link's
  // navigation is what opens CRED, as a direct result of the tap (Chrome only
  // opens another app from a tap). The record is created in the same moment
  // by submitting the hidden form, so a payment is tracked even if the user
  // never comes back to confirm it.
  function handlePayClick(e) {
    const check = validateUpiUri(launchUri);
    logUpiDebug("launch", { finalUpiUri: launchUri, credUrl: toCredPayUrl(launchUri), valid: check.valid, reason: check.reason });
    if (!canContinueDetails || initiating || !check.valid) {
      e.preventDefault();
      if (!check.valid) setLaunchError(`Couldn't build this payment link (${check.reason}). Please rescan the QR code.`);
      return;
    }
    setLaunchError(null);
    setAppOpened(true);
    setLaunchCount((n) => n + 1);
    payFormRef.current?.requestSubmit();
  }

  function handleReopenClick() {
    setLaunchError(null);
    setReturnedToTab(false);
    setLaunchCount((n) => n + 1);
  }

  function resolvePayment(status) {
    setConfirmError(null);
    startConfirm(async () => {
      const res = await confirmUpiPayment(initState.transactionId, status, confirmNote);
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
        <div className="fixed inset-0 z-35 flex flex-col bg-background text-foreground">
          <div className="flex items-center justify-between px-4 pb-2 pt-[calc(env(safe-area-inset-top)+14px)]">
            <Link
              href="/transactions"
              aria-label="Cancel"
              className="flex h-10 w-10 items-center justify-center rounded-full"
            >
              <X size={22} />
            </Link>
            <p className="text-sm font-medium">Scan QR to Pay</p>
            <span className="h-10 w-10" />
          </div>

          <div className="flex flex-1 items-center justify-center px-10">
            <UpiQrScanner onScan={handleScan} />
          </div>

          {scanError ? <p className="px-8 pb-2 text-center text-xs font-medium text-danger">{scanError}</p> : null}

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          <div className="flex justify-center pb-6">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium shadow-sm shadow-black/[0.03]"
            >
              <Upload size={15} /> Upload from gallery
            </button>
          </div>

          <div className="rounded-t-3xl bg-surface px-6 pb-[calc(env(safe-area-inset-bottom)+88px)] pt-3 text-center md:pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            <p className="text-sm font-medium">Scan any UPI QR code to pay</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/upi-logo.svg" alt="UPI" className="mx-auto mt-3 h-5 w-auto" />
            <button
              type="button"
              onClick={goToManualEntry}
              className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted"
            >
              <KeyRound size={13} /> Enter UPI ID manually instead
            </button>
          </div>
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
            onClick={continueFromManual}
            className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      ) : null}

      {step === "details" && !awaitingConfirmation ? (
        <div className="mt-6 space-y-4">
          <div>
            <Label>Payee Name</Label>
            <Input
              value={payeeName}
              onChange={(e) => setPayeeName(e.target.value)}
              placeholder={payeeUpi}
            />
            <p className="mt-1.5 text-xs text-muted">
              {payeeUpi}
              {scannedUri ? " · this QR's own label — edit it if it looks wrong, it won't change where the money goes" : ""}
            </p>
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
                inputMode="decimal"
                autoFocus={!amountLocked}
                readOnly={amountLocked}
                className={`w-full bg-transparent text-sm outline-none ${amountLocked ? "text-muted" : ""}`}
              />
            </div>
            {amountLocked ? <p className="mt-1.5 text-xs text-muted">Amount is fixed by this QR code.</p> : null}
          </div>
          <div>
            <Label>Category</Label>
            <CategorySelect categories={categories} defaultValue={categoryId} onValueChange={setCategoryId} />
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's it for?" />
            {scannedUri ? (
              <p className="mt-1.5 text-xs text-muted">This is just for your own records — it doesn&apos;t change what&apos;s sent to CRED.</p>
            ) : null}
          </div>
          {initState?.error ? <p className="text-xs font-medium text-danger">{initState.error}</p> : null}
          {launchError ? <p className="text-xs font-medium text-danger">{launchError}</p> : null}

          {isMobile ? (
            <a
              href={toCredPayUrl(launchUri)}
              onClick={handlePayClick}
              aria-disabled={!canContinueDetails || initiating}
              className={`flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 ${
                !canContinueDetails || initiating ? "pointer-events-none opacity-50" : ""
              }`}
            >
              {initiating ? "Opening CRED…" : `Pay ${formatCurrency(Number(amount) || 0)} with CRED`}
            </a>
          ) : (
            <button
              type="button"
              disabled={!canContinueDetails || initiating}
              onClick={() => payFormRef.current?.requestSubmit()}
              className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-50"
            >
              {initiating ? "Preparing…" : `Pay ${formatCurrency(Number(amount) || 0)}`}
            </button>
          )}

          <form ref={payFormRef} action={initiateAction} className="hidden">
            <input type="hidden" name="payeeUpiId" value={payeeUpi} />
            <input type="hidden" name="payeeName" value={payeeName} />
            <input type="hidden" name="amount" value={amount} />
            <input type="hidden" name="note" value={note} />
            <input type="hidden" name="categoryId" value={categoryId} />
            <input type="hidden" name="scannedUri" value={scannedUri || ""} />
            <input type="hidden" name="reference" value={reference} />
          </form>
        </div>
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
              <p className="text-sm font-medium">
                {!isMobile
                  ? "Ready to pay"
                  : returnedToTab
                    ? "Welcome back — we still can't tell if the payment went through. Please confirm below."
                    : "Complete the payment in CRED. Do not close this page until you return."}
              </p>
              {isMobile && launchError ? <p className="mt-3 text-xs font-medium text-danger">{launchError}</p> : null}
              <p className="mt-3 text-2xl font-bold">{formatCurrency(initState.amount)}</p>
              <p className="mt-1 text-sm text-muted">to {initState.payeeName}</p>

              {!isMobile ? (
              <div className="mt-6 flex w-full flex-col items-center gap-3 rounded-2xl border border-border p-4">
                <p className="text-xs text-muted">
                  CRED can&apos;t open from a desktop browser. Scan this QR with CRED on your phone to complete the payment.
                </p>
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="UPI payment QR code" width={200} height={200} className="rounded-xl" />
                ) : null}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(initState.upiUri)}
                    className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold"
                  >
                    <Copy size={13} /> Copy UPI Link
                  </button>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(payeeUpi)}
                    className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold"
                  >
                    <Copy size={13} /> Copy UPI ID
                  </button>
                </div>
              </div>
              ) : null}

              <p className="mt-8 text-xs font-medium text-muted">Did the payment go through?</p>
              <p className="mt-1 text-xs text-muted">
                This app has no way to verify that with the bank — it can only record what you tell it here.
              </p>
              <input
                value={confirmNote}
                onChange={(e) => setConfirmNote(e.target.value)}
                placeholder="UTR/reference number, or reason if it failed (optional)"
                className="mt-3 w-full max-w-xs rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none placeholder:text-muted focus:border-primary"
              />
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
                <a href={toCredPayUrl(initState.upiUri)} onClick={handleReopenClick} className="mt-4 text-xs font-semibold text-primary">
                  Open CRED again
                </a>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
