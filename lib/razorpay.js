import "server-only";
import crypto from "crypto";
import Razorpay from "razorpay";

let instance;

export function getRazorpay() {
  if (!instance) {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return instance;
}

// Verifies the razorpay_signature returned to the client after a Checkout
// payment. See https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration/#step-6-verify-payment-signature
export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

// Verifies the X-Razorpay-Signature header on incoming webhook requests.
export function verifyWebhookSignature(rawBody, signature) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return expected === signature;
}
