import mongoose from "mongoose";

const transferOtpSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  reference: { type: String, required: true, index: true }, // ⭐ ADD THIS

  otp: { type: String, required: true },

  expiresAt: Date,

  used: { type: Boolean, default: false }

}, { timestamps: true });

export default mongoose.model("TransferOTP", transferOtpSchema);