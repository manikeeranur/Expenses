import mongoose from "mongoose";

const RecurringPaymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    amount: { type: Number, required: true },
    frequency: { type: String, default: "Monthly" },
    nextDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.RecurringPayment || mongoose.model("RecurringPayment", RecurringPaymentSchema);
