import express from "express";
import crypto from "crypto";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import Ledger from "../models/Ledger.js";

const router = express.Router();

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    console.log("🔥 PAYSTACK WEBHOOK HIT");

    try {
      /* -------------------------------------------------
       * 1. VERIFY PAYSTACK SIGNATURE
       * ------------------------------------------------- */
      const hash = crypto
        .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
        .update(req.body)
        .digest("hex");

      if (hash !== req.headers["x-paystack-signature"]) {
        console.log("❌ Invalid Paystack signature");
        return res.sendStatus(401);
      }

      /* -------------------------------------------------
       * 2. PARSE EVENT
       * ------------------------------------------------- */
      const event = JSON.parse(req.body.toString());

      if (event.event !== "charge.success") {
        return res.sendStatus(200);
      }

      console.log("EVENT:", event.event);

      const data = event.data;
      console.log("RAW DATA:", JSON.stringify(data, null, 2));

      /* -------------------------------------------------
       * 3. EXTRACT RECEIVER ACCOUNT NUMBER (BANK TRANSFER)
       * ------------------------------------------------- */
      const accountNumber =
        data?.metadata?.receiver_account_number ||
        data?.authorization?.receiver_bank_account_number ||
        data?.authorization?.account_number;

      if (!accountNumber) {
        console.log("❌ No receiver account number found");
        return res.sendStatus(200);
      }

      /* -------------------------------------------------
       * 4. FIND USER BY PAYSTACK DVA
       * ------------------------------------------------- */
      const user = await User.findOne({
        "paystackDVA.accountNumber": accountNumber,
      });

      if (!user) {
        console.log("❌ User not found for account:", accountNumber);
        return res.sendStatus(200);
      }

      /* -------------------------------------------------
       * 5. FIND OR CREATE WALLET
       * ------------------------------------------------- */
      let wallet = await Wallet.findOne({ userId: user._id });

      if (!wallet) {
        wallet = await Wallet.create({
          userId: user._id,
          balance: 0,
          internalNuban: accountNumber,
          accountNumber,
        });
      }

      /* -------------------------------------------------
       * 6. PREVENT DUPLICATE CREDIT
       * ------------------------------------------------- */
      const existing = await Ledger.findOne({
        reference: data.reference,
        source: "paystack",
      });

      if (existing) {
        console.log("⚠️ Duplicate transaction ignored");
        return res.sendStatus(200);
      }

      /* -------------------------------------------------
       * 7. CREDIT WALLET
       * ------------------------------------------------- */
      const amount = data.amount / 100;

      const balanceBefore = wallet.balance;
      wallet.balance += amount;
      await wallet.save();
      const balanceAfter = wallet.balance;

      console.log("ACCOUNT NUMBER:", accountNumber);
      console.log("USER FOUND:", true);
      console.log("WALLET FOUND:", true);
      console.log("AMOUNT:", amount);

      /* -------------------------------------------------
       * 8. CREATE LEDGER (MATCH SCHEMA EXACTLY)
       * ------------------------------------------------- */
      await Ledger.create({
        userId: user._id,
        walletId: wallet._id,

        accountNumber,
        internalNuban: wallet.internalNuban,

        type: "CREDIT",          // MUST match enum
        source: "paystack",      // MUST match enum

        amount,
        balanceBefore,
        balanceAfter,

        reference: data.reference,
        narration: "Paystack bank transfer",
        status: "success",
      });

      /* -------------------------------------------------
       * 9. ACKNOWLEDGE PAYSTACK
       * ------------------------------------------------- */
      return res.sendStatus(200);
    } catch (err) {
      console.error("❌ Paystack webhook error:", err);
      return res.sendStatus(200); // NEVER fail webhook
    }
  }
);

export default router;