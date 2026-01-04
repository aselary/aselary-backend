import mongoose from "mongoose";

const ExternalTransferSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  amount: { type: Number, required: true },       // kobo
  fee: { type: Number, required: true },          // kobo
  totalDebit: { type: Number, required: true },   // amount + fee
  bankCode: { type: String, required: true },
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true },   // 10-digit NUBAN
  accountName: { type: String, required: true },
  narration: { type: String, default: "" },
  status: { type: String, enum: ["pending", "processing", "success", "failed", "canceled"], default: "pending", index: true },
  reference: { type: String, index: true }, // idempotency/trace
  provider: { type: String, default: "monnify" },
  providerRef: { type: String, default: "" },
  error: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.models.ExternalTransfer || mongoose.model("ExternalTransfer", ExternalTransferSchema);
