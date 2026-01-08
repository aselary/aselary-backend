// models/VirtualAccount.js
import mongoose from "mongoose";

const VirtualAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true,
    },
    bankName: String,
    provider: {
      type: String,
      default: "paystack",
    },
  },
  { timestamps: true }
);

export default mongoose.model("VirtualAccount", VirtualAccountSchema);