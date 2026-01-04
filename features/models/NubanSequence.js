import mongoose from "mongoose";

const nubanSequenceSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  value: { type: Number, default: 1000000000 } // start range
});

export default mongoose.model("NubanSequence", nubanSequenceSchema);