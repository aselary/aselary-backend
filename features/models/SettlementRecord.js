import mongoose from "mongoose";

const settlementRecordSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
    },

    paystackBalance: {
      type: Number,
      required: true,
    },

    platformLedgerTotal: {
      type: Number,
      required: true,
    },

   difference: {
  type: Number,
  required: true,
},

status: {
  type: String,
  enum: ["PENDING", "EXECUTED", "CLOSED"],
  default: "PENDING",
  index: true,
},

reconciliationStatus: {
  type: String,
  enum: ["MATCH", "MISMATCH"],
  required: true,
},

settlementState: {
  type: String,
  enum: ["CREATED", "EXECUTED", "CLOSED"],
  default: "CREATED",
},

note: {
  type: String,
  default: "",
},

isLocked: {
  type: Boolean,
  default: false,
},

closedAt: {
  type: Date,
},

    closedBy: {
      type: String,
    },

    payoutState: {
      type: String,
      enum: ["UNPAID", "PAID"],
      default: "UNPAID",
    },

    payoutReference: {
      type: String,
    },

    paidAt: {
      type: Date,
    },

    createdBy: {
      type: String, // admin id or system
      default: "SYSTEM",
    },

    executedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("SettlementRecord", settlementRecordSchema);