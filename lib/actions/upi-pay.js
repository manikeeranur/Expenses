"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/mongoose";
import Transaction from "@/models/Transaction";
import { requireUserId } from "@/lib/session";
import {
  isValidUpiId,
  sanitizeUpiText,
  buildUpiUri,
  finalizeScannedUpiUri,
  parseUpiUri,
  validateUpiUri,
  generateUpiReference,
  logUpiDebug,
} from "@/lib/upi";

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/categories");
  revalidatePath("/budgets");
  revalidatePath("/reports");
  revalidatePath("/reports/trends");
  revalidatePath("/calendar");
}

// Creates the transaction record BEFORE redirecting to the UPI app, so every
// initiated payment is tracked even if the user never comes back to confirm
// it. The reference and upi:// link are generated here (not trusted from the
// client) so they can't be spoofed.
export async function initiateUpiPayment(prevState, formData) {
  const userId = await requireUserId();

  const payeeUpiId = sanitizeUpiText(formData.get("payeeUpiId"), 100);
  const payeeName = sanitizeUpiText(formData.get("payeeName"), 100);
  const note = sanitizeUpiText(formData.get("note"), 200);
  const categoryId = formData.get("categoryId")?.toString() || null;
  const amount = Number(formData.get("amount"));
  // 2000 chars gives real headroom over signed dynamic QR intents (an
  // RSA-2048 "sign" field alone is ~350-500 base64 chars once combined with
  // mc/orgid/mode/refUrl); truncating any of that invalidates the signature
  // just as badly as re-encoding it would.
  const scannedUri = sanitizeUpiText(formData.get("scannedUri"), 2000);

  if (!isValidUpiId(payeeUpiId)) return { error: "Enter a valid UPI ID (e.g. name@bank)." };
  if (!amount || amount <= 0 || amount > 500000) return { error: "Enter a valid amount." };

  logUpiDebug("initiate:input", { payeeUpiId, payeeName, amount, note, scannedUri });

  await dbConnect();

  // Guards against a double-submit (slow network, impatient re-click, form
  // resubmission) creating two rows for what's really one payment attempt.
  const recentDuplicate = await Transaction.findOne({
    userId,
    upiId: payeeUpiId,
    amount,
    method: "UPI",
    paymentStatus: "initiated",
    createdAt: { $gte: new Date(Date.now() - 15_000) },
  }).sort({ createdAt: -1 });
  if (recentDuplicate) {
    return {
      success: true,
      transactionId: recentDuplicate._id.toString(),
      upiUri: recentDuplicate.upiUri,
      reference: recentDuplicate.reference,
      amount: recentDuplicate.amount,
      payeeName: recentDuplicate.title,
    };
  }

  const reference = generateUpiReference();

  // If this came from a scanned QR, reuse its exact original link instead of
  // rebuilding one from scratch — see finalizeScannedUpiUri for why.
  const scannedParsed = scannedUri ? parseUpiUri(scannedUri) : null;
  const upiUri =
    scannedParsed && scannedParsed.pa === payeeUpiId
      ? finalizeScannedUpiUri(scannedUri, { amount })
      : buildUpiUri({ payeeUpiId, payeeName, amount, note, reference });

  logUpiDebug("initiate:final", {
    originalQrPayload: scannedUri || null,
    parsedUpiUri: scannedParsed?.raw || null,
    pa: scannedParsed?.pa ?? payeeUpiId,
    pn: scannedParsed?.pn ?? payeeName,
    am: scannedParsed?.am ?? amount,
    cu: scannedParsed?.cu ?? "INR",
    tn: scannedParsed?.tn ?? note,
    tr: scannedParsed?.tr ?? reference,
    mc: scannedParsed?.mc ?? null,
    finalUpiUri: upiUri,
  });

  const validation = validateUpiUri(upiUri);
  if (!validation.valid) {
    logUpiDebug("initiate:invalid", { upiUri, reason: validation.reason });
    return { error: "Could not build a valid UPI payment link from this QR. Try scanning it again." };
  }

  const transaction = await Transaction.create({
    userId,
    title: payeeName || payeeUpiId,
    type: "expense",
    amount,
    categoryId: categoryId || null,
    method: "UPI",
    date: new Date(),
    description: note,
    tags: ["UPI"],
    upiId: payeeUpiId,
    reference,
    paymentStatus: "initiated",
    upiUri,
  });

  revalidateAll();
  return {
    success: true,
    transactionId: transaction._id.toString(),
    upiUri,
    reference,
    amount,
    payeeName: payeeName || payeeUpiId,
    // Dev-only trail for the on-page debug panel — never sent in production.
    debug:
      process.env.NODE_ENV === "production"
        ? null
        : {
            originalQrPayload: scannedUri || null,
            parsedUpiUri: scannedParsed?.raw || null,
            pa: scannedParsed?.pa ?? payeeUpiId,
            pn: scannedParsed?.pn ?? payeeName,
            am: scannedParsed?.am ?? amount,
            cu: scannedParsed?.cu ?? "INR",
            tn: scannedParsed?.tn ?? note,
            tr: scannedParsed?.tr ?? reference,
            mc: scannedParsed?.mc ?? null,
            finalUpiUri: upiUri,
          },
  };
}

// The only way a UPI-initiated transaction's status can change after
// creation. Scoped to the owning user and to transactions still awaiting an
// answer, so a resolved payment can't be flipped again from a stale screen.
//
// This is a self-report, not a bank-verified confirmation — see the note at
// the top of lib/upi.js. `note` is optional, user-typed text: a UTR/reference
// number when marking "paid", or a short reason when marking "cancelled".
// It's stored purely for the user's own records, not used for any decision.
export async function confirmUpiPayment(transactionId, status, note) {
  const userId = await requireUserId();
  if (status !== "paid" && status !== "cancelled") return { error: "Invalid status." };

  await dbConnect();
  const transaction = await Transaction.findOne({
    _id: transactionId,
    userId,
    method: "UPI",
    paymentStatus: { $in: ["initiated", "pending"] },
  });
  if (!transaction) return { error: "This payment was not found or has already been resolved." };

  const cleanNote = sanitizeUpiText(note, 200) || null;
  transaction.paymentStatus = status;
  if (status === "paid") transaction.bankReferenceNumber = cleanNote;
  else transaction.failureReason = cleanNote;
  await transaction.save();

  revalidateAll();
  return { success: true, status };
}
