import mongoose from "mongoose";

const toBankTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },


        planId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Plan",
          index: true,
        },


    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    amount: {
  type: Number,
  required: true,
},

   fee: {
     type: Number,
     required: true,
     default: 0,
   },

totalDebit: {
  type: Number,
  required: true,
},

    bankName: {
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

    accountName: {
      type: String,
      required: true,
    },

    reference: {
      type: String,
      unique: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SUCCESS", "FAILED", "REVERSED", "OTP_REQUIRED", "OTP_VERIFIED", "WITHDRAW_FUND", ],
      default: "PENDING",
      index: true,
    },

    transferCode: {
      type: String,
    },

    otpVerifiedAt: {
      type: Date,
    },

    reason: {
      type: String,
      default: null
    },

   completedAt: {
     type: Date,
     default: null
   }
  },
  { timestamps: true }
);

export default mongoose.model("ToBankTransaction", toBankTransactionSchema);