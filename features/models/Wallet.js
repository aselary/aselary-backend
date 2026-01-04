import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  accountNumber: {
      type: String,
      unique: true,  // ALIAS (what user sees)
      sparse: true,   
      index: true
    },

    internalNuban: {
      type: String,     // REAL system account
      unique: true,
      sparse: true,     // 🔥 THIS IS THE FIX
      select: false,
      index: true
    },

  balance: {
    type: Number,
    default: 0,
  },

  email: { 
    type: String,
  },

  bankName: {
    type: String,
    default: "Aselary Wallet",
  },

  provider: {
    type: String,
    default: "ASELARY SMARTSAVE",
  },

    // Will be used when you activate Paystack Dedicated Virtual Account
    virtualAccount: {
      reference: String,
      bankName: String,
      bankId: String,
      accountName: String,
    },

    // All wallet transactions
    transactions: [
      {
        type: {
          type: String,
          enum: ["deposit", "withdraw"],
        },
        method: {
          type: String,
          enum: ["card", "bank", "ussd", "transfer"],
        },
        amount: Number,
        reference: String, // Paystack reference
        status: String, // pending | success | failed
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", walletSchema);