import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },

    internalNuban: {
      type: String,
      required: false, // PRIVATE
      default: null,
    },

    accountNumber: {
      type: String,
      required: false, // what user knows
      default: null,
    },
    
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },

    source: {
      type: String,
      enum: ["DEPOSIT", "WITHDRAWAL", "A2A", "REVERSAL", "CHARGE", "TO_BANK", "TO_BANK_REVERSAL", "paystack"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    balanceBefore: {
      type: Number,
      required: true,
    },

    balanceAfter: {
      type: Number,
      required: true,
    },

    reference: {
      type: String,
      unique: true,
      required: true,
    },

    narration: String,

    metadata: Object,
  },
  { timestamps: true }
);

export default mongoose.model("Ledger", ledgerSchema);