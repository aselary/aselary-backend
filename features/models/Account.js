import { Schema, Types, model } from "mongoose";
const AccountSchema = new Schema({
  userId: { type: Types.ObjectId, index: true, required: true },
  balance: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});
export default model("Account", AccountSchema);
