import mongoose from "mongoose";

const transferOtpSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  otp: String,
  transferData: Object,
  expiresAt: Date,
  used: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("TransferOTP", transferOtpSchema);