import mongoose from "mongoose";

const BankLinkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mobileNumber: { type: String, required: true },
    aa: { type: String, required: true },
    vua: { type: String, required: true },
    consentId: { type: String, default: null },
    consentStatus: {
      type: String,
      enum: ["PENDING", "INITIATED", "ACTIVE", "REJECTED", "EXPIRED", "REVOKED", "PAUSED"],
      default: "PENDING",
    },
    consentDataRange: {
      from: { type: String, default: null },
      to: { type: String, default: null },
    },
    dataSessionId: { type: String, default: null },
    dataSessionStatus: { type: String, enum: ["PENDING", "PARTIAL", "COMPLETED", "FAILED"], default: null },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
    lastSyncedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.BankLink || mongoose.model("BankLink", BankLinkSchema);
