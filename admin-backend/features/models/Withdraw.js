import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "paid", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

const Withdrawal = mongoose.model("Withdraw", withdrawalSchema);

export default Withdrawal;
