import mongoose from "mongoose";

const FraudLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    ip: {
      type: String,
    },

    userAgent: {
      type: String,
    },

    endpoint: {
      type: String,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    riskScore: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.FraudLog ||
  mongoose.model("FraudLog", FraudLogSchema);