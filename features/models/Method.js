import mongoose from "mongoose";

const methodSchema = new mongoose.Schema(
   {
     userId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "User",
       required: true,
     },
 
     type: {
       type: String,
       enum: ["deposit", "withdraw", "transfer"],
       required: true,
     },
 
     method: {
       type: String,
       enum: ["account", "card", "ussd", "transfer"],
       required: true,
     },
 
     amount: {
       type: Number,
       required: true,
     },
 
     status: {
       type: String,
       enum: ["pending", "success", "failed"],
       default: "pending",
     },
 
      // ✅ YOUR SYSTEM REFERENCE (PRIMARY)
     internalRef: {
       type: String,
       required: true,
       unique: true,
       index: true,
     },
 
     // ❌ NOT UNIQUE — PAYSTACK MAY REUSE / COLLIDE
     providerRef: {
       type: String,
       index: true,
       sparse: true,
       default: null,
     },
       
     
   },
   { timestamps: true }
 );
export default mongoose.model("Method", methodSchema);