import mongoose from "mongoose";

const TreasuryExecutionLogSchema = new mongoose.Schema(
  {
    payoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TreasuryPayout",
      emphasize: true,
      index: true,
      required: true,
    },

    payoutRef: {
      type: String,
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "NGN",
    },

    recipientCode: {
      type: String,
      required: true,
    },

    executedBy: {
      type: String, // admin email or adminId
      required: true,
    },

    executedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    note: {
      type: String,
      default: "",
    },

    payoutSnapshot: {
      type: Object, // full frozen snapshot
      required: true,
    },
  },
  { timestamps: false }
);

export default mongoose.model(
  "TreasuryExecutionLog",
  TreasuryExecutionLogSchema
);