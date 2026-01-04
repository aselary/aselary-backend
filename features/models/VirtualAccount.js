import mongoose from "mongoose";
const VirtualAccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, index: true },
  nuban: { type: String, required: true },                 // 10-digit display account
  bankName: { type: String, default: "Monnify Partner Bank (VA)" },
  provider: { type: String, default: "monnify" },
  providerRef: { type: String }                             // what Monnify gives you
}, { timestamps: true });

export default mongoose.model("VirtualAccount", VirtualAccountSchema);

