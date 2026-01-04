import express from "express";
import crypto from "crypto";
import User from "../models/User.js";
import Ledger from "../models/Ledger.js";
import Wallet from "../models/Wallet.js";

const router = express.Router();

router.post("/paystack", async (req, res) => {
  try {
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).send("Invalid signature");
    }

    const event = req.body;

    if (event.event !== "charge.success") {
      return res.sendStatus(200);
    }

    const data = event.data;
    const accountNumber = data.account?.account_number;
    if (!accountNumber) return res.sendStatus(200);

    const user = await User.findOne({
  "paystackDVA.accountNumber": accountNumber,
});
if (!user) return res.sendStatus(200);

const exists = await Ledger.findOne({
  reference: data.reference,
  source: "PAYSTACK",
});
if (exists) return res.sendStatus(200);

// ✅ DEFINE AMOUNT ONCE
const amount = data.amount / 100;

// 1️⃣ CREATE LEDGER ENTRY
await Ledger.create({
  user: user._id,
  type: "CREDIT",
  amount,
  reference: data.reference,
  source: "PAYSTACK",
  narration: "Paystack deposit",
});

const creditedAmount = data.amount / 100;

await Wallet.findOneAndUpdate(
  { userId: user._id },
  { $inc: { balance: creditedAmount } },
  { new: true }
);

return res.sendStatus(200);
  } catch (err) {
    console.error("Paystack webhook error:", err);
    return res.sendStatus(200);
  }
});

export default router;