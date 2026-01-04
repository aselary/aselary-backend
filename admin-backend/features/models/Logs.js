import mongoose from "mongoose";

const sterlingLogSchema = new mongoose.Schema({
  reference: String,
  receiver: String,
  amount: Number,
  status: String,
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("SterlingLog", sterlingLogSchema);
