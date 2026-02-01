import mongoose from "mongoose";

const recordSchema = new mongoose.Schema(
  {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    type: {
      type: String,
      enum: ["deposit", "withdraw"],
      default: "deposit",
    },

    reference: {
      type: String,
      required: true,
      unique: true,
    },

    // 🧠 NEW: which day in the plan this payment is
    planDay: {
      type: Number, // e.g. Day 3 of 30
      required: true,
    },

    // 🧠 NEW: snapshot of plan duration
    planDuration: {
      type: Number, // total days (30, 60, 90…)
      required: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Record", recordSchema);