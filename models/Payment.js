import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["checkout", "qr"], required: true },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpayQrCodeId: { type: String, default: null },
    qrImageUrl: { type: String, default: null },
    amount: { type: Number, default: null },
    method: { type: String, default: null },
    status: { type: String, enum: ["created", "paid", "failed", "closed"], default: "created" },
    note: { type: String, default: "" },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
