import mongoose from "mongoose";

const ContributionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const GoalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: "Target" },
    color: { type: String, default: "#6C5CE7" },
    target: { type: Number, required: true },
    saved: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    contributions: { type: [ContributionSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Goal || mongoose.model("Goal", GoalSchema);
