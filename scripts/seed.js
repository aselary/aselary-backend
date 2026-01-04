import dotenv from "dotenv";
import mongoose from "mongoose";

// import your models (adjust paths to match your project)
import User from "../features/models/User.js";
import Transaction from "../features/models/Transaction.js";
import Repayment from "../features/models/Repayment.js";
import CreditLine from "../features/models/CreditLine.js";
import isDev from "../features/utils/isDev.js";

dotenv.config();

try {
  // 1) Find or create the user by email so we always have a REAL _id
  const email = process.env.GMAIL_EMAIL;
  if (!email) throw new Error("SEED_USER_EMAIL missing in .env");

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      fullName: "Seed User",
      password: "TEMP_HASH_OR_LEAVE_OUT", // if your schema requires it; otherwise omit
      status: "active"
    });
    if (isDev) {
    console.log("Created seed user:", user._id.toString());
    }
  } else {
    if (isDev) {
    console.log("Found existing user:", user._id.toString());
    }
  }

  const userId = user._id;

  // 2) Wipe this user's old data (safe to re-run)
  await Promise.all([
    Transaction.deleteMany({ userId }),
    Repayment.deleteMany({ userId }),
    CreditLine.deleteMany({ userId })
  ]);
  if (isDev) {
  console.log("Cleared old data for user", userId.toString());
  }

  // 3) Insert some realistic sample data
  const now = new Date();

  await CreditLine.create({
    userId,
    limit: 200000,          // ₦200k limit
    balance: 50000,         // currently used
    openedAt: new Date(now.getFullYear(), now.getMonth() - 4, 10),
    status: "active"
  });

  await Transaction.insertMany([
    { userId, amount: 12000, type: "deposit",  channel: "bank_transfer", date: new Date(now.getFullYear(), now.getMonth(), 1) },
    { userId, amount:  4500, type: "withdraw", channel: "payout",         date: new Date(now.getFullYear(), now.getMonth(), 5) },
    { userId, amount:  8000, type: "deposit",  channel: "card",           date: new Date(now.getFullYear(), now.getMonth(), 12) },
    { userId, amount: 15000, type: "deposit",  channel: "bank_transfer",  date: new Date(now.getFullYear(), now.getMonth(), 20) },
  ]);

  await Repayment.insertMany([
    { userId, amount: 10000, paidAt: new Date(now.getFullYear(), now.getMonth() - 1, 28) },
    { userId, amount:  8000, paidAt: new Date(now.getFullYear(), now.getMonth(),  15) },
  ]);
    if (isDev) {
  console.log("✅ Seed data inserted.");
    }

} catch (err) {
  if (isDev) {
  console.error("❌ Seeding failed:", err);
  }
} finally {
  await mongoose.connection.close();
  if (isDev) {
  console.log("🔌 MongoDB connection closed.");
  }
}
