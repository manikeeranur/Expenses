"use client";

import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { X, Check, Camera, KeyRound, Copy, Upload } from "lucide-react";
import jsQR from "jsqr";
import QRCode from "qrcode";
import UpiQrScanner from "@/components/upi/UpiQrScanner";
import CategorySelect from "@/components/ui/CategorySelect";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initiateUpiPayment, confirmUpiPayment } from "@/lib/actions/upi-pay";
import { parseUpiUri, isValidUpiId, validateUpiUri, logUpiDebug, getAllUpiParams, UPI_DEBUG } from "@/lib/upi";
import { formatCurrency } from "@/lib/format";
import { useMounted } from "@/lib/useMounted";

// Every UPI-compliant app (Google Pay, PhonePe, Paytm, BHIM, Union Bank's own
// app, etc.) registers itself as a handler for the generic "upi://pay"
// scheme — that registration is what makes it "UPI-compliant" under NPCI's
// spec. So the correct way to let the user pick ANY installed app is to
// navigate to "upi://pay?..." directly and let Android's own OS-level intent
// chooser list every app that can handle it. Hard-coding a specific app's
// private scheme (tez://, phonepe://, paytmmp://, …) bypasses that chooser,
// locks the picker to whatever apps happen to be in this list, and isn't
// needed — it used to exist here purely as a menu of shortcuts.
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

  const [step, setStep] = useState("scan"); // scan, manual, details, confirm
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
  // appOpened: user tapped the single "Pay with UPI" link and the browser
  // handed off to Android's app chooser. returnedToTab: this page regained
  // visibility afterwards (the user switched back, either mid-payment or
  // after finishing) — we still can't tell which, hence PENDING not SUCCESS.
  const [appOpened, setAppOpened] = useState(false);
  const [returnedToTab, setReturnedToTab] = useState(false);
  const [launchError, setLaunchError] = useState(null);
  const [scannedUri, setScannedUri] = useState(null);
  const [amountLocked, setAmountLocked] = useState(false);
  const fileInputRef = useRef(null);

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
    setStep("details");
  }, []);

  function goToManualEntry() {
    setScannedUri(null);
    setAmountLocked(false);
    setStep("manual");
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
  const showLaunchScreen = awaitingConfirmation && !finalStatus && isMobile && !appOpened;

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

  // Detects "the user came back to this tab" so an app-opened payment can be
  // shown as PENDING instead of silently staying APP_OPENED forever — it does
  // NOT mean the payment succeeded, only that we can now ask the user.
  useEffect(() => {
    if (!appOpened || finalStatus) return;
    function handleVisibility() {
      if (document.visibilityState === "visible") setReturnedToTab(true);
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [appOpened, finalStatus]);

  // Fires directly inside the <a>'s click handler — a same-tick response to
  // the user's own tap, not a callback queued after some unrelated async
  // work — which is what lets Android Chrome treat the upi://pay navigation
  // as a trusted user gesture and hand off to the OS app chooser.
  function handleLaunchClick(e) {
    const uri = initState?.upiUri;
    const check = validateUpiUri(uri);
    logUpiDebug("launch", { finalUpiUri: uri, valid: check.valid, reason: check.reason });
    if (!check.valid) {
      e.preventDefault();
      setLaunchError(`Couldn't verify this payment link (${check.reason}). Please rescan the QR code.`);
      return;
    }
    setLaunchError(null);
    setAppOpened(true);
    // No e.preventDefault(): the anchor's own href navigation is what opens
    // the UPI app, so the browser handles it as a direct, top-level,
    // user-gesture-driven deep link — no window.location/intent:// needed.
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
              <p className="mt-1.5 text-xs text-muted">This is just for your own records — it doesn&apos;t change what&apos;s sent to the UPI app.</p>
            ) : null}
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
          <input type="hidden" name="scannedUri" value={scannedUri || ""} />

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

          <div className="rounded-2xl bg-warning-light p-3">
            <p className="text-xs font-medium">If your bank rejects this (&quot;exceeded bank limit&quot;, etc.):</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-muted">
              <li>Banks apply lower limits to first-time payees for ~24 hours — try again later, or use a payee you&apos;ve paid before.</li>
              <li>Try again and pick a different app from your phone&apos;s picker — apps can apply different limits for the same payee.</li>
              <li>This is a bank-side decision, not something this app controls — the payment isn&apos;t lost, it simply never left your account.</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={initiating}
            className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60"
          >
            {initiating ? "Preparing…" : `Pay ${formatCurrency(Number(amount) || 0)} via UPI`}
          </button>
        </form>
      ) : null}

      {showLaunchScreen ? (
        <div className="mt-6">
          <div className="rounded-2xl bg-surface p-4 text-center">
            <p className="text-sm text-muted">Pay</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(initState.amount)}</p>
            <p className="mt-1 text-sm text-muted">to {initState.payeeName}</p>
          </div>
          {launchError ? <p className="mt-4 text-xs font-medium text-danger">{launchError}</p> : null}
          {/* A real <a href="upi://pay?..."> click, not window.location/intent:// —
              this is what lets Android Chrome hand off to its own OS-level app
              chooser, listing every installed UPI-compliant app (Google Pay,
              PhonePe, Paytm, BHIM, your bank's app, …) rather than a fixed list
              this code picks for you. */}
          <a
            href={initState.upiUri}
            onClick={handleLaunchClick}
            className="mt-5 flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25"
          >
            Open UPI App to Pay {formatCurrency(initState.amount)}
          </a>
          <p className="mt-4 text-center text-xs text-muted">
            Your phone will ask which app to use — pick any UPI app you have installed.
          </p>
          {DEV && initState?.debug ? <UpiDebugPanel debug={initState.debug} /> : null}
        </div>
      ) : awaitingConfirmation ? (
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
                    : "Complete the payment in your UPI app. Do not close this page until you return."}
              </p>
              <p className="mt-3 text-2xl font-bold">{formatCurrency(initState.amount)}</p>
              <p className="mt-1 text-sm text-muted">to {initState.payeeName}</p>

              <div className="mt-6 flex w-full flex-col items-center gap-3 rounded-2xl border border-border p-4">
                <p className="text-xs text-muted">
                  {isMobile
                    ? "If nothing opened, scan this QR with your UPI app instead, or copy the details below."
                    : "UPI apps can't open from a desktop browser. Scan this QR with your phone to complete the payment."}
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
                <button
                  type="button"
                  onClick={() => {
                    setAppOpened(false);
                    setReturnedToTab(false);
                    setLaunchError(null);
                  }}
                  className="mt-4 text-xs font-semibold text-primary"
                >
                  Open UPI app again
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

// Dev-only: lets you compare the original QR payload against the exact URI
// this app is about to hand to the UPI app, field by field. Never rendered
// in production (gated by DEV at the call site).
function UpiDebugPanel({ debug }) {
  const rows = [
    ["PA", debug.pa],
    ["PN", debug.pn],
    ["AM", debug.am],
    ["CU", debug.cu],
    ["TN", debug.tn],
    ["TR", debug.tr],
    ["MC", debug.mc],
  ];
  return (
    <details className="mt-5 rounded-2xl border border-dashed border-border p-3 text-left text-xs">
      <summary className="cursor-pointer font-semibold text-muted">Debug: QR → parsed → final URI</summary>
      <div className="mt-2 space-y-2">
        <div>
          <p className="font-semibold text-muted">Original QR payload</p>
          <p className="break-all">{debug.originalQrPayload || "(none — manual entry)"}</p>
        </div>
        <div>
          <p className="font-semibold text-muted">Parsed UPI URI</p>
          <p className="break-all">{debug.parsedUpiUri || "(none — manual entry)"}</p>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-2">
              <span className="text-muted">{label}</span>
              <span className="truncate font-medium">{value ?? "—"}</span>
            </div>
          ))}
        </div>
        <div>
          <p className="font-semibold text-muted">Final UPI URI (sent to the app)</p>
          <p className="break-all font-medium">{debug.finalUpiUri}</p>
        </div>
        {debug.diff ? (
          <div>
            <p className="font-semibold text-muted">
              Diff vs original: {debug.diff.identical ? "identical, byte-for-byte" : "DIFFERS — see below"}
            </p>
            {!debug.diff.identical ? (
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {debug.diff.missing.map((d) => (
                  <li key={`m-${d.key}`}>
                    missing <span className="font-medium">{d.key}</span> (was {d.was})
                  </li>
                ))}
                {debug.diff.added.map((d) => (
                  <li key={`a-${d.key}`}>
                    added <span className="font-medium">{d.key}</span> = {d.now}
                  </li>
                ))}
                {debug.diff.changed.map((d) => (
                  <li key={`c-${d.key}`}>
                    changed <span className="font-medium">{d.key}</span>: {d.was} → {d.now}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        {debug.allOriginalParams ? (
          <div>
            <p className="font-semibold text-muted">All original QR params</p>
            <pre className="mt-1 whitespace-pre-wrap break-all">{JSON.stringify(debug.allOriginalParams, null, 2)}</pre>
          </div>
        ) : null}
        {debug.allFinalParams ? (
          <div>
            <p className="font-semibold text-muted">All final URI params</p>
            <pre className="mt-1 whitespace-pre-wrap break-all">{JSON.stringify(debug.allFinalParams, null, 2)}</pre>
          </div>
        ) : null}
      </div>
    </details>
  );
}
