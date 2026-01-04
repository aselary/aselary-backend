import mongoose from "mongoose";

const TreasuryPayoutSchema = new mongoose.Schema(
  {
    settlement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SettlementRecord",
      required: true,
      unique: true, // ONE payout per settlement
    },

    reference: {
      type: String,
      required: true,
      unique: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "NGN",
    },

    destination: {
      type: String,
      enum: ["TREASURY"],
      default: "TREASURY",
    },

    payoutState: {
      type: String,
      enum: [
        "READY",
        "BLOCKED",
        "PROCESSING",
        "PAID",
        "FAILED",
      ],
      default: "READY",
    },

    blockReason: {
      type: String,
      default: null,
    },

    recipientCode: {
      type: String,
      default: null, // WILL COME FROM PAYSTACK LATER
    },

    isLocked: {
      type: Boolean,
      default: true,
    },

    executedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: String,
      default: "SYSTEM",
    },
  },
  { timestamps: true }
);

export default mongoose.model("TreasuryPayout", TreasuryPayoutSchema);