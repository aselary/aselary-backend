import mongoose from "mongoose";

const DepositSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "NGN" },        // change if you like
    method: { type: String, enum: ["instant", "bank_transfer", "card", "cash", "demo"], required: true },
    description: { type: String },

    // lifecycle
    status: { type: String, enum: ["pending", "confirmed", "canceled", "expired", "failed"], default: "pending" },
    reference: { type: String, unique: true, index: true, required: true },   // human short code e.g. D4P7KQ
    idempotencyKey: { type: String, index: true, sparse: true }, // avoid duplicates (client-provided)
    providerResponse: { type: Object, default: null},

    metadata: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now},
    updatedAt: { type: Date, default: Date.now},

    expiresAt: { type: Date },         // auto-cleanup for pending/abandoned
    confirmedAt: { type: Date }
  },
  { timestamps: true }
);

// TTL cleanup for expired docs (Mongo will delete after expiresAt)
DepositSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("DepositIntent", DepositSchema);
