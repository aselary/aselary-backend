import mongoose from "mongoose";

const internalNubanSequenceSchema = new mongoose.Schema({
  era: {
    type: Number, // 70 → 71 → 72
    default: 70,
  },
  counter: {
    type: Number, // 0 → 99,999,999
    default: 0,
  },
});

export default mongoose.model(
  "InternalNubanSequence",
  internalNubanSequenceSchema
);