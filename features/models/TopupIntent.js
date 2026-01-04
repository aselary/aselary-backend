import mongoose from "mongoose";
const TopupIntentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  amount: { type: Number, default: 0 },                     // optional tracking
  method: { type: String, default: "bank_transfer" },
  status: { type: String, enum: ["pending","confirmed","credited","expired","canceled"], default: "pending", index: true },
  ref: { type: String, unique: true, index: true },
  expiresAt: { type: Date, index: true },
  meta: {}
}, { timestamps: true });

export default mongoose.model("TopupIntent", TopupIntentSchema);
