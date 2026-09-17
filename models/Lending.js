import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["interest", "principal"], default: "interest" },
    method: { type: String, enum: ["cash", "upi"], default: "cash" },
    remarks: { type: String, trim: true },
  },
  { _id: false }
);

const ReminderSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["sent", "simulated", "failed"], default: "simulated" },
  },
  { _id: false }
);

const LendingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    borrower: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    principal: { type: Number, required: true },
    dateGiven: { type: Date, required: true },
    interestRatePercent: { type: Number, default: 0 },
    interestDueDay: { type: Number, min: 1, max: 31 },
    note: { type: String, trim: true },
    status: { type: String, enum: ["active", "closed"], default: "active" },
    order: { type: Number, default: 0 },
    payments: { type: [PaymentSchema], default: [] },
    reminders: { type: [ReminderSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Lending || mongoose.model("Lending", LendingSchema);
