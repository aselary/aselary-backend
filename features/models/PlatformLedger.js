import mongoose from "mongoose";

const platformLedgerSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      index: true,
    },

    source: {
      type: String,
      enum: ["A2A", "TO_BANK", "DEPOSIT", "ADJUSTMENT"],
      required: true,
    },

    type: {
      type: String,
      enum: [
        "PLATFORM_FEE",
        "BANK_SETTLEMENT",
        "MANUAL_ADJUSTMENT",
      ],
      required: true,
    },

    direction: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    narration: {
      type: String,
      required: true,
    },

    meta: {
      type: Object, // optional: userId, txId, etc
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("PlatformLedger", platformLedgerSchema);