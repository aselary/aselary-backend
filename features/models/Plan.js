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

    totalTarget: {
      type: Number,
      required: true
    },

    balance: { 
      type: Number, 
      default: 0 
    },

    withdrawLocked: { 
      type: Boolean, 
      default: true 
    },

    narration: {
      type: String,
      default: ""
    },

    nextRunAt: {
      type: Date,
      required: false,
      default: null,
    },

    missedCount: {
      type: Number,
      default: 0
    },

    withdrawalAccount: {

    bankName: {
      type: String,
      required: true,
    },

    bankCode: {
      type: String,
      required: true
    },

    accountNumber: {
      type: String,
      required: true
    },

    accountName: {
      type: String,
      required: true
    },
    
    locked: {
      type: Boolean,
      default: false
    }
  },

    status: {
      type: String,
      enum: ["active", "completed", "closing", "terminated", "archived"],
      default: "active",
    },

    terminatedAt: {
      type: Date,
      default: null
    },

    archivedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const Plan = mongoose.model("Plan", planSchema);

export default Plan;