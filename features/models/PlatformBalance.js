import mongoose from "mongoose";

const platformBalanceSchema = new mongoose.Schema(
  {
    currency: {
      type: String,
      default: "NGN",
    },

    balance: {
      type: Number,
      default: 0, // total platform money (fees)
    },

    totalFeesCollected: {
      type: Number,
      default: 0, // lifetime fees
    },

    lastUpdatedReason: {
      type: String,
      default: "init",
    },
  },
  {
    timestamps: true,
  }
);

const PlatformBalance =
  mongoose.models.PlatformBalance ||
  mongoose.model("PlatformBalance", platformBalanceSchema);

export default PlatformBalance;