import mongoose from "mongoose";

const TreasuryRecipientSchema = new mongoose.Schema(
  {
    accountName: {
      type: String,
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

    currency: {
      type: String,
      default: "NGN",
    },

    recipientCode: {
      type: String,
      required: true,
      unique: true,
    },

    provider: {
      type: String,
      default: "PAYSTACK",
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("TreasuryRecipient", TreasuryRecipientSchema);