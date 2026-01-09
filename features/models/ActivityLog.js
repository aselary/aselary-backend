import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    /* ================= CORE OWNERSHIP ================= */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },

    /* ================= BUSINESS MEANING ================= */

    /**
     * WHAT happened (high-level intent)
     */
    category: {
      type: String,
      enum: [
        "DEPOSIT",          // money entered wallet
        "TRANSFER",         // money moved out
        "A2A",              // wallet-to-wallet
      ],
      required: true,
      index: true,
    },

    /**
     * HOW it happened (transport / rail)
     */
    channel: {
      type: String,
      enum: [
        "CARD",
        "USSD",
        "BANK_TRANSFER",
        "A2A",
      ],
      required: true,
      index: true,
    },

    /**
     * EXACT action (machine-level)
     */
    type: {
      type: String,
      enum: [
        "DEPOSIT",
        "TO_BANK",
        "A2A",
      ],
      required: true,
      index: true,
    },

    /* ================= MONEY ================= */

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    reference: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REVERSED"],
      default: "PENDING",
      index: true,
    },

    /* ================= USER-FACING SEMANTICS ================= */

    /**
     * AUTHORITATIVE money direction
     * Frontend must trust ONLY this
     */
    direction: {
      type: String,
      enum: ["DEBIT", "CREDIT", "OUTGOING"],
      required: true,
      index: true,
    },

    /**
     * Human-readable counterparty
     * (bank name, user name, provider, etc)
     */
    counterpartyName: {
      type: String,
      default: null,
    },

    narration: {
      type: String,
      default: null,
    },

    /* ================= ENGINE LINKS ================= */

    engineRefs: {
      ledgerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ledger",
        default: null,
      },

      a2aTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "A2ATransaction",
        default: null,
      },

      toBankTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ToBankTransaction",
        default: null,
      },

      depositTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DepositTransaction",
        default: null,
      },
    },

    /* ================= CONTEXT (NON-AUTHORITATIVE) ================= */

    meta: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ActivityLog", activityLogSchema);