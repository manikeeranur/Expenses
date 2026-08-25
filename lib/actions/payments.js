"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/mongoose";
import Payment from "@/models/Payment";
import Transaction from "@/models/Transaction";
import { requireUserId } from "@/lib/session";
import { getRazorpay, verifyPaymentSignature } from "@/lib/razorpay";

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/reports");
  revalidatePath("/pay");
}

export async function createCheckoutOrder(prevState, formData) {
  const userId = await requireUserId();
  const amount = Number(formData.get("amount"));
  const note = formData.get("note")?.toString().trim() || "";

  if (!amount || amount <= 0) return { error: "Enter a valid amount." };

  await dbConnect();
  const razorpay = getRazorpay();

  let order;
  try {
    order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `me_${Date.now()}`,
      notes: { userId, note },
    });
  } catch (err) {
    return { error: err?.error?.description || "Could not start payment. Try again." };
  }

  const payment = await Payment.create({
    userId,
    kind: "checkout",
    razorpayOrderId: order.id,
    amount,
    note,
    status: "created",
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    paymentDbId: payment._id.toString(),
    note,
  };
}

export async function verifyCheckoutPayment(prevState, formData) {
  const userId = await requireUserId();
  const orderId = formData.get("razorpay_order_id")?.toString();
  const paymentId = formData.get("razorpay_payment_id")?.toString();
  const signature = formData.get("razorpay_signature")?.toString();
  const paymentDbId = formData.get("paymentDbId")?.toString();

  if (!orderId || !paymentId || !signature) return { error: "Missing payment details." };
  if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
    return { error: "Payment could not be verified." };
  }

  await dbConnect();
  const paymentDoc = await Payment.findOne({ _id: paymentDbId, userId, razorpayOrderId: orderId });
  if (!paymentDoc) return { error: "Payment record not found." };

  if (paymentDoc.status === "paid" && paymentDoc.transactionId) {
    return { success: true, transactionId: paymentDoc.transactionId.toString(), amount: paymentDoc.amount };
  }

  const transaction = await Transaction.create({
    userId,
    title: paymentDoc.note ? `Added Money — ${paymentDoc.note}` : "Added Money",
    type: "income",
    amount: paymentDoc.amount,
    method: "Razorpay",
    date: new Date(),
    description: paymentDoc.note,
    tags: ["Razorpay", "Real Payment"],
    reference: paymentId,
  });

  paymentDoc.razorpayPaymentId = paymentId;
  paymentDoc.status = "paid";
  paymentDoc.transactionId = transaction._id;
  await paymentDoc.save();

  revalidateAll();
  return { success: true, transactionId: transaction._id.toString(), amount: paymentDoc.amount };
}

export async function createQrCode(prevState, formData) {
  const userId = await requireUserId();
  const amountRaw = formData.get("amount")?.toString().trim();
  const note = formData.get("note")?.toString().trim() || "Scan to Pay";
  const amount = amountRaw ? Number(amountRaw) : null;

  await dbConnect();
  const razorpay = getRazorpay();

  let qr;
  try {
    qr = await razorpay.qrCode.create({
      type: "upi_qr",
      name: note.slice(0, 40),
      usage: "multiple_use",
      fixed_amount: Boolean(amount),
      payment_amount: amount ? Math.round(amount * 100) : undefined,
      description: note,
      notes: { userId },
    });
  } catch (err) {
    return { error: err?.error?.description || "Could not generate QR code." };
  }

  const payment = await Payment.create({
    userId,
    kind: "qr",
    razorpayQrCodeId: qr.id,
    qrImageUrl: qr.image_url,
    amount,
    note,
    status: "created",
  });

  revalidatePath("/pay/scan");
  return { success: true, qrDbId: payment._id.toString(), qrImageUrl: qr.image_url, qrCodeId: qr.id, amount, note };
}

export async function fetchQrPayments(qrDbId) {
  const userId = await requireUserId();
  await dbConnect();
  const qrDoc = await Payment.findOne({ _id: qrDbId, userId, kind: "qr" });
  if (!qrDoc) return { error: "QR code not found." };

  const razorpay = getRazorpay();
  let result;
  try {
    result = await razorpay.qrCode.fetchAllPayments(qrDoc.razorpayQrCodeId, {});
  } catch (err) {
    return { error: err?.error?.description || "Could not check for payments." };
  }

  const captured = (result?.items || []).filter((p) => p.status === "captured");
  let newCount = 0;

  for (const p of captured) {
    const already = await Payment.findOne({ razorpayPaymentId: p.id });
    if (already) continue;

    const amount = p.amount / 100;
    const transaction = await Transaction.create({
      userId,
      title: `Received via QR${qrDoc.note ? ` — ${qrDoc.note}` : ""}`,
      type: "income",
      amount,
      method: "UPI (Razorpay QR)",
      date: new Date(p.created_at * 1000),
      description: qrDoc.note,
      tags: ["Razorpay", "UPI", "Real Payment"],
      upiId: p.vpa || null,
      reference: p.id,
    });

    await Payment.create({
      userId,
      kind: "qr",
      razorpayQrCodeId: qrDoc.razorpayQrCodeId,
      razorpayPaymentId: p.id,
      amount,
      method: p.method,
      status: "paid",
      transactionId: transaction._id,
    });
    newCount++;
  }

  if (newCount > 0) revalidateAll();
  return { success: true, newCount };
}

export async function closeQrCode(qrDbId) {
  const userId = await requireUserId();
  await dbConnect();
  const qrDoc = await Payment.findOne({ _id: qrDbId, userId, kind: "qr" });
  if (!qrDoc) return { error: "QR code not found." };

  const razorpay = getRazorpay();
  let stillLiveOnRazorpay = false;
  try {
    await razorpay.qrCode.close(qrDoc.razorpayQrCodeId);
  } catch {
    // Multiple-use QR codes can't actually be closed via Razorpay's API —
    // the code stays scannable there even though we stop tracking it here.
    stillLiveOnRazorpay = true;
  }
  qrDoc.status = "closed";
  await qrDoc.save();
  revalidatePath("/pay/scan");
  return {
    success: true,
    warning: stillLiveOnRazorpay
      ? "Stopped tracking it here, but Razorpay reported it may still be live — check your Razorpay dashboard."
      : undefined,
  };
}

export async function requestInstantSettlement(prevState, formData) {
  await requireUserId();
  const note = formData.get("note")?.toString().trim() || "";

  const razorpay = getRazorpay();
  try {
    const settlement = await razorpay.settlements.createOndemandSettlement({
      settle_full_balance: true,
      description: note.slice(0, 80),
    });
    return { success: true, settlementId: settlement.id, amount: settlement.amount / 100, status: settlement.status };
  } catch (err) {
    const reason = err?.error?.reason;
    if (reason === "instant_settlements_test_mode_blocked") {
      return {
        error:
          "Razorpay blocks Instant Settlement in test mode — this only works once you complete Razorpay's KYC and go live with real keys.",
      };
    }
    return { error: err?.error?.description || "Could not request settlement." };
  }
}
