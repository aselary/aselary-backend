import mongoose from "mongoose";

const PlatformSettlementSchema = new mongoose.Schema(
  {
    // Total amount moved to bank
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Snapshot of Paystack balance at settlement time
    paystackBalanceAtTime: {
      type: Number,
      required: true,
      min: 0,
    },

    // Snapshot of platform ledger total at settlement time
    ledgerTotalAtTime: {
      type: Number,
      required: true,
      min: 0,
    },

    // Difference between Paystack and Ledger
    difference: {
      type: Number,
      required: true,
    },

    // Settlement status
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "PENDING",
      index: true,
    },

    // Bank details where money was sent
    bank: {
      name: String,
      accountNumber: String,
      accountName: String,
      provider: {
        type: String,
        default: "PAYSTACK",
      },
    },

    // Paystack transfer reference
    transferReference: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Admin who approved the settlement
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },

    // Extra metadata (optional but future-proof)
    meta: {
      reason: String,
      note: String,
      forced: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "PlatformSettlement",
  PlatformSettlementSchema
);