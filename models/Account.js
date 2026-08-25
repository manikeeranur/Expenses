import mongoose from "mongoose";

const AccountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, default: "Savings Account" },
    bankName: { type: String, default: null },
    ifsc: { type: String, default: null },
    color: { type: String, default: "#6C5CE7" },
    balance: { type: Number, default: 0 },
    last4: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Account || mongoose.model("Account", AccountSchema);
