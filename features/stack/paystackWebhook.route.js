import express from "express";
import crypto from "crypto";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import Ledger from "../models/Ledger.js";
import ActivityLog from "../models/ActivityLog.js";
import isDev from "../utils/isDev.js";

const router = express.Router();

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    if (isDev) {
    console.log("🔥 PAYSTACK WEBHOOK HIT");
    }

    try {
      /* -------------------------------------------------
       * 1. VERIFY PAYSTACK SIGNATURE
       * ------------------------------------------------- */
      const hash = crypto
        .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
        .update(req.body)
        .digest("hex");

      if (hash !== req.headers["x-paystack-signature"]) {
        return res.sendStatus(401);
      }

      /* -------------------------------------------------
       * 2. PARSE EVENT
       * ------------------------------------------------- */
      const event = JSON.parse(req.body.toString());

      if (event.event !== "charge.success") {
        return res.sendStatus(200);
      }
        if (isDev) {
      console.log("EVENT:", event.event);
        }

      const data = event.data;
      let accountNumber = null;
      if (isDev) {
      console.log("RAW DATA:", JSON.stringify(data, null, 2));
      }

    /* -------------------------------------------------
 * 4. RESOLVE USER (CARD OR BANK TRANSFER)
 * ------------------------------------------------- */

let user = null;

// 1️⃣ CARD / USSD → metadata.userId
if (data.metadata?.userId) {
  user = await User.findById(data.metadata.userId);
}

// 2️⃣ BANK TRANSFER → receiver virtual account
if (!user && (data.channel === "bank_transfer" || data.channel === "dedicated_nuban") ) {
   const accountNumber =
    data.dedicated_account?.account_number ||
    data.authorization?.receiver_bank_account_number ||
    data.receiver_bank_account_number;

  console.log("🔍 Bank transfer resolution", {
    channel: data.channel,
    accountNumber,
    reference: data.reference,
  });

  if (accountNumber) {
    user = await User.findOne({
      "paystackDVA.accountNumber": accountNumber,
    });
  }
}

// 3️⃣ FINAL GUARD
if (!user) {
  console.log("❌ User not resolved for Paystack event", {
    channel: data.channel,
    reference: data.reference,
  });
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
         
 const internalNuban = wallet.internalNuban || null;
      
let counterpartyName = "Paystack"; // default fallback

if (data.channel === "dedicated_nuban") {
  const senderName = data.sender_name || "Unknown Sender";
  const senderBank = data.sender_bank || "External Bank";
  counterpartyName = `${senderBank} (${senderName})`;
}
else if (data.channel === "card") {
  counterpartyName = `${data.authorization?.bank || data.authorization?.brand || "Card Payment"}`;
}
else if (data.channel === "ussd") {
  counterpartyName = `${data.authorization?.bank || "USSD / Paystack"}`;
}

     await Ledger.create({
  userId: user._id,
  walletId: wallet._id,

  accountNumber,
  internalNuban,

  type: "CREDIT",
  source: "paystack",

  amount,
  balanceBefore,
  balanceAfter,

  reference: data.reference,
  narration: "Paystack bank transfer",

  metadata: {
    provider: "paystack",
    paidAt: data.paid_at,
  },
});
      await ActivityLog.create({
        userId: user._id,
        actorId: user._id,        // user performed the action
        walletId: wallet._id,

       // BUSINESS MEANING
       category: "TRANSFER",
       channel: "BANK_TRANSFER",
       type: "TO_BANK",
       direction: "CREDIT",

      // MONEY
       amount,
       reference: data.reference,
       status: "SUCCESS",

      // OPTIONAL BUT GOOD
       narration: "Paystack bank transfer",
       counterpartyName,

      // ENGINE LINKS (optional but future-proof)
    engineRefs: {
       ledgerId: null, // or ledger._id if you store it
       depositTransactionId: null,
    },

    meta: {
       provider: "paystack",
       accountNumber,
       paidAt: data.paid_at,
    },
});
      /* -------------------------------------------------
       * 9. ACKNOWLEDGE PAYSTACK
       * ------------------------------------------------- */
      return res.sendStatus(200);
    } catch (err) {
      if (isDev) {
      console.error("❌ LEDGER FAILURE:", err.message);
      }
      return res.sendStatus(200); // NEVER fail webhook
    }
  }
);

export default router;