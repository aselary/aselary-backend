import mongoose from "mongoose";

const LedgerReconciliationSchema = new mongoose.Schema(
  {
    settlementRef: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    paystackAmount: {
      type: Number,
      required: true,
    },

    ledgerTotal: {
      type: Number,
      required: true,
    },

    payoutTotal: {
      type: Number,
      required: true,
    },

    difference: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["BALANCED", "MISMATCH"],
      default: "MISMATCH",
      index: true,
    },

    locked: {
      type: Boolean,
      default: false,
    },

    computedAt: {
      type: Date,
      default: Date.now,
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "LedgerReconciliation",
  LedgerReconciliationSchema
);