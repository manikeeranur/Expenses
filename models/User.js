import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    image: { type: String, default: null },
    preferences: {
      currency: { type: String, default: "INR" },
      firstDayOfMonth: { type: Number, default: 1 },
      dateFormat: { type: String, default: "DD MMM YYYY" },
      pushNotifications: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: true },
      darkMode: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
