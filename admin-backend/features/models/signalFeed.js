import mongoose from "mongoose";

const signalFeedSchema = new mongoose.Schema({
  type: { type: String, required: true },
  message: { type: String, required: true },
  source: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("SignalFeed", signalFeedSchema);
