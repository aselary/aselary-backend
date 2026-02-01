import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true, // e.g. "Daily ₦200"
    },

    amount: {
      type: Number,
      required: true, // 200, 300, 500
    },

    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: true,
    },

    duration: {
      type: Number,
      required: true, // how many days/weeks/months
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
      required: true,
    },

    balance: { 
      type: Number, 
      default: 0 
    },

    withdrawLocked: { 
      type: Boolean, 
      default: true 
    },

    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
  },
  { timestamps: true }
);

const Plan = mongoose.model("Plan", planSchema);

export default Plan;