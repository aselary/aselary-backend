import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    bankCode: {
      type: String,
      required: true,
    },

    accountNumber: {
      type: String,
      required: true,
    },

    recipientCode: {
      type: String,
    },

    reference: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },

    reason: {
      type: String,
      default: "User cash out",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Withdrawal", withdrawalSchema);