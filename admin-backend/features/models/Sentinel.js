import mongoose from "mongoose";

const sentinelLogicSchema = new mongoose.Schema({
  threatLevel: Number,
  aiMode: String,
  autoReact: Boolean,
  notes: String,
    status: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.SentinelLogic ||
  mongoose.model("SentinelLogic", sentinelLogicSchema);
