import dbConnect from "@/lib/mongoose";
import Payment from "@/models/Payment";
import Transaction from "@/models/Transaction";
import { verifyWebhookSignature } from "@/lib/razorpay";

// Configure this URL (https://yourdomain.com/api/webhooks/razorpay) in the
// Razorpay Dashboard → Webhooks, subscribed to "qr_code.credited" and
// "payment.captured", using RAZORPAY_WEBHOOK_SECRET as the secret. Razorpay
// can't reach localhost, so QR payments during local dev are picked up via
// the "Check for payments" button (fetchQrPayments) instead — this route is
// what keeps things in sync once deployed.
export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  await dbConnect();

  if (event.event === "qr_code.credited") {
    const payload = event.payload.qr_code.entity;
    const paymentEntity = event.payload.payment?.entity;
    const qrCodeId = payload.id;

    const qrDoc = await Payment.findOne({ razorpayQrCodeId: qrCodeId, kind: "qr" }).sort({ createdAt: 1 });
    if (qrDoc && paymentEntity) {
      const already = await Payment.findOne({ razorpayPaymentId: paymentEntity.id });
      if (!already) {
        const amount = paymentEntity.amount / 100;
        const transaction = await Transaction.create({
          userId: qrDoc.userId,
          title: `Received via QR${qrDoc.note ? ` — ${qrDoc.note}` : ""}`,
          type: "income",
          amount,
          method: "UPI (Razorpay QR)",
          date: new Date(),
          description: qrDoc.note,
          tags: ["Razorpay", "UPI", "Real Payment"],
          upiId: paymentEntity.vpa || null,
          reference: paymentEntity.id,
        });
        await Payment.create({
          userId: qrDoc.userId,
          kind: "qr",
          razorpayQrCodeId: qrCodeId,
          razorpayPaymentId: paymentEntity.id,
          amount,
          method: paymentEntity.method,
          status: "paid",
          transactionId: transaction._id,
        });
      }
    }
  }

  return Response.json({ received: true });
}
