"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/mongoose";
import Transaction from "@/models/Transaction";
import { requireUserId } from "@/lib/session";
import { isValidUpiId, sanitizeUpiText, buildUpiUri, generateUpiReference } from "@/lib/upi";

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

  if (!isValidUpiId(payeeUpiId)) return { error: "Enter a valid UPI ID (e.g. name@bank)." };
  if (!amount || amount <= 0 || amount > 500000) return { error: "Enter a valid amount." };

  await dbConnect();

  const reference = generateUpiReference();
  const upiUri = buildUpiUri({ payeeUpiId, payeeName, amount, note, reference });

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
  };
}

// The only way a UPI-initiated transaction's status can change after
// creation. Scoped to the owning user and to transactions still awaiting an
// answer, so a resolved payment can't be flipped again from a stale screen.
export async function confirmUpiPayment(transactionId, status) {
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

  transaction.paymentStatus = status;
  await transaction.save();

  revalidateAll();
  return { success: true, status };
}
