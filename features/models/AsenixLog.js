import mongoose from "mongoose";

const asenixLogSchema = new mongoose.Schema({
  phoneNumber: String,
  userId: String,
  status: String, // success, blocked, failed
  origin: String, // ASENIX Auto Detection
  ipAddress: String,
  userAgent: String,
  time: { type: Date, default: Date.now }
});

export default mongoose.model("AsenixLog", asenixLogSchema);
