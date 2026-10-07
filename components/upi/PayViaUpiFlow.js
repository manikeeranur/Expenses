"use client";

import { useActionState, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Check, Camera, KeyRound, Upload } from "lucide-react";
import jsQR from "jsqr";
import QRCode from "qrcode";
import UpiQrScanner from "@/components/upi/UpiQrScanner";
import CategorySelect from "@/components/ui/CategorySelect";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { recordUpiPayment, lookupPayee } from "@/lib/actions/upi-pay";
import { parseUpiUri, isValidUpiId, buildUpiUri, toGooglePayIntentUrl, logUpiDebug, getAllUpiParams } from "@/lib/upi";
import { formatCurrency } from "@/lib/format";
import { useMounted } from "@/lib/useMounted";

// Scan → one tap → Google Pay → back here to save it. The tap can't be
// skipped: Chrome only opens another app from a user's tap, never from a
// camera scan on its own.
//
// The payment handed to Google Pay is kept as "pending" until the user says
// whether it went through. It's mirrored to sessionStorage because Android
// can discard this tab while Google Pay is in front; the page then reloads
// on return, and this is how it still knows what to save. The in-memory copy
// keeps the flow working when sessionStorage is unavailable.
const PENDING_KEY = "upi-pay-pending";
let memoryPending = null;
const pendingListeners = new Set();

function subscribePending(listener) {
  pendingListeners.add(listener);
  return () => pendingListeners.delete(listener);
}

function readPending() {
  try {
    return sessionStorage.getItem(PENDING_KEY) ?? memoryPending;
  } catch {
    return memoryPending;
  }
}

function writePending(value) {
  memoryPending = value ? JSON.stringify(value) : null;
  try {
    if (memoryPending) sessionStorage.setItem(PENDING_KEY, memoryPending);
    else sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // Storage blocked — memoryPending still covers this page session.
  }
  pendingListeners.forEach((listener) => listener());
}

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
  const router = useRouter();
  const mounted = useMounted();
  const isMobile = mounted && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = mounted && /Android/i.test(navigator.userAgent);

  const [step, setStep] = useState("scan"); // scan, manual, pay
  const [payeeUpi, setPayeeUpi] = useState("");
  const [payeeName, setPayeeName] = useState("");
  // Set only when the QR itself fixes the amount; otherwise it's typed in
  // Google Pay, exactly as when scanning there.
  const [fixedAmount, setFixedAmount] = useState(null);
  const [upiUri, setUpiUri] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?._id || "");
  const [scanError, setScanError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const fileInputRef = useRef(null);

  const pendingRaw = useSyncExternalStore(subscribePending, readPending, () => null);
  const pending = pendingRaw ? JSON.parse(pendingRaw) : null;

  const [saveState, saveAction, saving] = useActionState((_prev, formData) => recordUpiPayment(formData), undefined);

  useEffect(() => {
    if (!saveState?.success) return;
    writePending(null);
    router.replace("/transactions");
  }, [saveState, router]);

  const handleScan = useCallback((text) => {
    const parsed = parseUpiUri(text);
    if (!parsed) {
      logUpiDebug("scan:rejected", { originalQrPayload: text });
      setScanError("That QR doesn't look like a UPI payment code. Try again or enter details manually.");
      return;
    }
    logUpiDebug("scan:parsed", { originalQrPayload: text, allParams: getAllUpiParams(parsed.raw) });
    setPayeeUpi(parsed.pa);
    setPayeeName(parsed.pn || "");
    setFixedAmount(parsed.am);
    setUpiUri(parsed.raw);
    setScanError("");
    setStep("pay");

    // The QR's own "pn" is often a generic aggregator/POS name ("Paytm"),
    // not the real business name — if this UPI ID was renamed on a past
    // payment, prefer that, and reuse the category from last time.
    lookupPayee(parsed.pa).then((res) => {
      if (res?.name) setPayeeName(res.name);
      if (res?.categoryId) setCategoryId(res.categoryId);
    });
  }, []);

  function goToManualEntry() {
    setStep("manual");
  }

  async function continueFromManual() {
    const upiId = payeeUpi.trim();
    const saved = await lookupPayee(upiId);
    const name = payeeName.trim() || saved?.name || "";
    setPayeeUpi(upiId);
    setPayeeName(name);
    if (saved?.categoryId) setCategoryId(saved.categoryId);
    setFixedAmount(null);
    setUpiUri(buildUpiUri({ payeeUpiId: upiId, payeeName: name }));
    setStep("pay");
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

  // Desktop can't open a UPI app — show the payment as a QR to scan with the
  // phone instead.
  useEffect(() => {
    if (step !== "pay" || isMobile || !upiUri) return;
    QRCode.toDataURL(upiUri, { margin: 1, width: 220 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [step, isMobile, upiUri]);

  // Runs inside the link's own click, so the link's navigation still opens
  // Google Pay as a direct result of the tap; this only remembers what to
  // save when the user comes back.
  function startPayment() {
    logUpiDebug("launch", { upiUri, googlePayUrl: isAndroid ? toGooglePayIntentUrl(upiUri) : null });
    writePending({ payeeUpi, payeeName, amount: fixedAmount, upiUri, categoryId });
  }

  function retryPayment() {
    setPayeeUpi(pending.payeeUpi);
    setPayeeName(pending.payeeName);
    setFixedAmount(pending.amount);
    setUpiUri(pending.upiUri);
    setCategoryId(pending.categoryId);
    setStep("pay");
    writePending(null);
  }

  const canContinueManual = isValidUpiId(payeeUpi.trim());

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-6 md:pt-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Pay via UPI</h1>
        <Link
          href="/transactions"
          onClick={() => writePending(null)}
          aria-label="Cancel"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface"
        >
          <X size={16} />
        </Link>
      </div>

      {saveState?.success ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
            <Check size={28} className="text-success" />
          </span>
          <p className="mt-4 text-lg font-bold">Payment saved</p>
        </div>
      ) : pending ? (
        <form action={saveAction} className="mt-6 space-y-4">
          <input type="hidden" name="payeeUpiId" value={pending.payeeUpi} />
          <input type="hidden" name="upiUri" value={pending.upiUri} />

          <div className="rounded-2xl bg-surface p-4 text-center shadow-sm shadow-black/[0.03]">
            <p className="text-sm font-semibold">Did the payment go through?</p>
            <p className="mt-1 text-xs text-muted">Save it once Google Pay shows it as paid — this app can&apos;t check with the bank.</p>
          </div>

          <div>
            <Label>Paid to</Label>
            <Input name="payeeName" defaultValue={pending.payeeName} placeholder={pending.payeeUpi} />
            <p className="mt-1.5 text-xs text-muted">{pending.payeeUpi} · rename it here if the QR shows the wrong name</p>
          </div>
          <div>
            <Label>Amount paid</Label>
            <div className="flex items-center gap-1 rounded-2xl border border-border bg-background px-4 py-3 focus-within:border-primary">
              <span className="text-sm text-muted">₹</span>
              <input
                name="amount"
                defaultValue={pending.amount ?? ""}
                readOnly={pending.amount != null}
                autoFocus={pending.amount == null}
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                required
                placeholder="0"
                className={`w-full bg-transparent text-sm outline-none ${pending.amount != null ? "text-muted" : ""}`}
              />
            </div>
          </div>
          <div>
            <Label>Category</Label>
            <CategorySelect categories={categories} defaultValue={pending.categoryId} />
          </div>

          {saveState?.error ? <p className="text-xs font-medium text-danger">{saveState.error}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center rounded-2xl bg-success py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Yes, save payment"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={retryPayment}
            className="flex w-full items-center justify-center rounded-2xl border border-border py-3 text-sm font-semibold disabled:opacity-60"
          >
            Didn&apos;t go through — try again
          </button>
        </form>
      ) : null}

      {!pending && !saveState?.success && step === "pay" ? (
        <div className="mt-10 flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-2xl font-bold text-primary-dark">
            {(payeeName || payeeUpi).charAt(0).toUpperCase()}
          </span>
          <p className="mt-3 max-w-full truncate text-lg font-bold">{payeeName || payeeUpi}</p>
          <p className="mt-0.5 max-w-full truncate text-xs text-muted">{payeeUpi}</p>
          {fixedAmount != null ? (
            <p className="mt-5 text-3xl font-bold">{formatCurrency(fixedAmount)}</p>
          ) : (
            <p className="mt-5 text-xs text-muted">You&apos;ll enter the amount in Google Pay</p>
          )}

          {isMobile ? (
            <>
              <a
                href={isAndroid ? toGooglePayIntentUrl(upiUri) : upiUri}
                onClick={startPayment}
                className="mt-8 flex w-full max-w-xs items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25"
              >
                {isAndroid ? "Pay with Google Pay" : "Open UPI app to pay"}
              </a>
              {isAndroid ? (
                <a href={upiUri} onClick={startPayment} className="mt-4 text-xs font-semibold text-muted">
                  Use another UPI app
                </a>
              ) : null}
            </>
          ) : (
            <>
              <p className="mt-8 text-xs text-muted">Scan this with Google Pay on your phone, then save it here.</p>
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="UPI payment QR code" width={200} height={200} className="mt-3 rounded-xl" />
              ) : null}
              <button
                type="button"
                onClick={startPayment}
                className="mt-5 flex w-full max-w-xs items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25"
              >
                I&apos;ve paid — save it
              </button>
            </>
          )}

          <button type="button" onClick={() => setStep("scan")} className="mt-6 text-xs font-semibold text-primary">
            Scan a different QR
          </button>
        </div>
      ) : null}

      {!pending && !saveState?.success && step === "scan" ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
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

          <div className="rounded-t-3xl bg-surface px-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-3 text-center shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
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

      {!pending && !saveState?.success && step === "manual" ? (
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

    </div>
  );
}
