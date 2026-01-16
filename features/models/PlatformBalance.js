import mongoose from "mongoose";

const platformBalanceSchema = new mongoose.Schema(
  {
    currency: {
      type: String,
      default: "NGN",
    },

     environment: {
      type: String,
      enum: ['test', 'production'],
      default: "production",
      index: true
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