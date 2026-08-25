import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["expense", "income"], required: true },
    amount: { type: Number, required: true, min: 0 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
    method: { type: String, default: "" },
    date: { type: Date, required: true },
    description: { type: String, default: "" },
    tags: { type: [String], default: [] },
    receiptName: { type: String, default: null },
    receiptSize: { type: String, default: null },
    upiId: { type: String, default: null },
    reference: { type: String, default: null },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, date: -1 });

export default mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
