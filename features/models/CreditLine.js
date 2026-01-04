import { Schema, Types, model } from "mongoose";

const CreditLineSchema = new Schema({
  userId: { type: Types.ObjectId, index: true, required: true, unique: true },
  limit: { type: Number, required: true },          // e.g. 200000
  currentBalance: { type: Number, required: true },  // e.g. 60000
}, { timestamps: true });

export default model("CreditLine", CreditLineSchema);
