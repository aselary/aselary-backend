import express from "express";
import crypto from "crypto";
import User from "../models/User.js";
import Ledger from "../models/Ledger.js";
import Wallet from "../models/Wallet.js";

const router = express.Router();

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    console.log("🔥 PAYSTACK WEBHOOK HIT");
    try {
      const hash = crypto
        .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
        .update(req.body)
        .digest("hex");

      if (hash !== req.headers["x-paystack-signature"]) {
        return res.sendStatus(401);
      }

      const event = JSON.parse(req.body.toString());

      if (event.event !== "charge.success") {
        return res.sendStatus(200);
      }

      const data = event.data;
     // 1️⃣ Get account number from Paystack event
const accountNumber = data?.account?.account_number;
if (!accountNumber) return res.sendStatus(200);

// 2️⃣ Find user by Paystack Dedicated Account number
const user = await User.findOne({
  "paystackDVA.accountNumber": accountNumber,
});
if (!user) return res.sendStatus(200);

// 3️⃣ Get user's wallet
const wallet = await Wallet.findOne({ userId: user._id });
if (!wallet) return res.sendStatus(200);

// 4️⃣ Prevent duplicate credit
const exists = await Ledger.findOne({
  reference: data.reference,
  source: "PAYSTACK",
});
if (exists) return res.sendStatus(200);

// 5️⃣ Convert amount from kobo to naira
const amount = data.amount / 100;

// 6️⃣ Credit wallet
wallet.balance += amount;
await wallet.save();

// 7️⃣ Create ledger record
await Ledger.create({
  userId: user._id,
  type: "credit",
  amount,
  reference: data.reference,
  source: "PAYSTACK",
  narration: "Paystack bank transfer",
  status: "success",
});

// 8️⃣ Acknowledge Paystack
return res.sendStatus(200);
    } catch (err) {
      console.error("Paystack webhook error:", err);
      return res.sendStatus(200);
    }
  }
);

export default router;