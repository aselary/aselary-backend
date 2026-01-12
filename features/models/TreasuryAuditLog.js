import mongoose from "mongoose";

const TreasuryAuditLogSchema = new mongoose.Schema(
  {
    action: String,
    entity: String,
    entityId: mongoose.Schema.Types.ObjectId,
    performedBy: String,
    meta: Object,
     environment: {
      type: String,
      enum: ['test', 'production'],
      required: true,
      index: true
    },
  },
  { timestamps: true }
);

export default mongoose.model("TreasuryAuditLog", TreasuryAuditLogSchema);