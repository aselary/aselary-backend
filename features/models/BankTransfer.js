// models/BankTransfer.js
import mongoose from "mongoose";

const bankTransferSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, index: true, required: true },
  ref: { type: String, index: true },
  bankCode: { type: String, required: true },
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true }, // 10 digits
  accountName: { type: String, required: true },
  amount: { type: Number, required: true }, // in kobo
  fee: { type: Number, default: 0 },        // in kobo
  status: { type: String, enum: ["pending","processing","sent","failed","canceled"], default: "pending" },
  reason: { type: String },
}, { timestamps: true });

export default mongoose.model("BankTransfer", bankTransferSchema);