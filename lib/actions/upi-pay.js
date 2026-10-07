"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/mongoose";
import Transaction from "@/models/Transaction";
import { requireUserId } from "@/lib/session";
import { isValidUpiId, sanitizeUpiText, generateUpiReference } from "@/lib/upi";

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/categories");
  revalidatePath("/budgets");
  revalidatePath("/reports");
  revalidatePath("/reports/trends");
  revalidatePath("/calendar");
}

// A merchant's own QR often carries a generic/aggregator name (e.g. a static
// QR issued via Mswipe/BharatPe shows the aggregator's name, not the shop's)
// — there's no field in the UPI intent itself for the "real" business name.
// Once the user renames a payee for this UPI ID on any past payment, reuse
// that name here instead of whatever the QR itself says, along with the
// category used last time.
export async function lookupPayee(upiId) {
  const userId = await requireUserId();
  const cleanUpiId = sanitizeUpiText(upiId, 100);
  if (!isValidUpiId(cleanUpiId)) return { name: null, categoryId: null };

  await dbConnect();
  const tx = await Transaction.findOne({ userId, upiId: cleanUpiId, title: { $ne: null } })
    .sort({ createdAt: -1 })
    .select("title categoryId")
    .lean();
  return { name: tx?.title || null, categoryId: tx?.categoryId?.toString() || null };
}

// Saves a payment the user has just made in Google Pay. It's created only
// once they come back and say it went through (Google Pay reports nothing
// back to a website — see lib/upi.js), and the amount is whatever they
// actually paid: a QR without a fixed amount has it typed in Google Pay.
export async function recordUpiPayment(formData) {
  const userId = await requireUserId();

  const payeeUpiId = sanitizeUpiText(formData.get("payeeUpiId"), 100);
  const payeeName = sanitizeUpiText(formData.get("payeeName"), 100);
  const categoryId = formData.get("categoryId")?.toString() || null;
  const amount = Number(formData.get("amount"));
  // Room for signed QR payloads (an RSA "sign" alone is ~350-500 chars).
  const upiUri = sanitizeUpiText(formData.get("upiUri"), 2000) || null;

  if (!isValidUpiId(payeeUpiId)) return { error: "This UPI ID doesn't look valid. Scan the QR again." };
  if (!amount || amount <= 0 || amount > 500000) return { error: "Enter the amount you paid." };

  await dbConnect();
  await Transaction.create({
    userId,
    title: payeeName || payeeUpiId,
    type: "expense",
    amount,
    categoryId,
    method: "UPI",
    date: new Date(),
    tags: ["UPI"],
    upiId: payeeUpiId,
    reference: generateUpiReference(),
    paymentStatus: "paid",
    upiUri,
  });

  revalidateAll();
  return { success: true };
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
