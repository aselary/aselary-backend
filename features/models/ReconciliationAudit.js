import mongoose from "mongoose";

const ReconciliationAuditSchema = new mongoose.Schema(
  {
    paystackBalance: { type: Number, required: true },
    platformLedgerTotal: { type: Number, required: true },
    difference: { type: Number, required: true },

    status: {
      type: String,
      enum: ["MATCH", "MISMATCH", "FORCE_ACCEPTED"],
      default: "MISMATCH",
    },

    reason: { type: String }, // admin explanation
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

    locked: { type: Boolean, default: false }, // once approved, cannot change
  },
  { timestamps: true }
);

export default mongoose.model(
  "ReconciliationAudit",
  ReconciliationAuditSchema
);