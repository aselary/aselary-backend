import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
          
        actorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
          index: true,
        },

            planId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Plan",
              required: true,
              index: true,
            },
    
        walletId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Wallet",
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
            "EARLY_WITHDRAW",
            "WITHDRAW_FUND",
          ],
          required: true,
          index: true,
        },

    amount: {
      type: Number,
      required: true,
    },
        category: {
          type: String,
          enum: [
            "DEPOSIT", 
            "TRANSFER",
            "A2A",
            "CARD", 
            "USSD", 
            "PLAN"
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
            "EARLY_WITHDRAW",
            "WITHDRAW_FUND",
          ],
          required: true,
          index: true,
        },
    

        reference: {
          type: String,
          required: true,
          index: true,
        },
    
        status: {
          type: String,
          enum: ["PENDING", "SUCCESS", "FAILED", "REVERSED", "OUTGOING"],
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
},
  { timestamps: true }
);

export default mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);