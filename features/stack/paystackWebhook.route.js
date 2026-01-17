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
    
    console.log("🔥 PAYSTACK WEBHOOK HIT");
    

    try {
      const MIN_DEPOSIT = 950
     
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
        const DEPOSIT_EVENTS = [
             "charge.success",          // card, ussd, some bank transfers
              "transfer.success",        // dedicated NUBAN deposit
            ];

        const WITHDRAWAL_EVENTS = [
               "transfer.success",        // withdrawal success
               "transfer.failed",         // withdrawal failed
             ];

        if (isDev) {
      console.log("EVENT:", event.event);
        }

      const data = event.data;
      // -------------------------------
// WITHDRAWAL EVENTS
// -------------------------------
if (
  WITHDRAWAL_EVENTS.includes(event.event) &&
  data?.reference &&
  data?.reason === "withdrawal"
) {
  const ledger = await Ledger.findOne({
    _id: data.reference,
    source: "withdrawal",
    status: "PENDING",
  });

  if (!ledger) {
    return res.sendStatus(200);
  }

  if (event.event === "transfer.success") {
    ledger.status = "SUCCESS";
    ledger.completedAt = new Date();
    await ledger.save();

    await ActivityLog.findOneAndUpdate(
      { reference: data.reference },
      { status: "SUCCESS" }
    );

    return res.sendStatus(200);
  }

  if (event.event === "transfer.failed") {
    const wallet = await Wallet.findById(ledger.walletId);
    if (!wallet) return res.sendStatus(200);

    wallet.balance += ledger.amount;
    await wallet.save();

    ledger.status = "FAILED";
    ledger.refunded = true;
    ledger.refundedAt = new Date();
    await ledger.save();

    await ActivityLog.findOneAndUpdate(
      { reference: data.reference },
      {
        status: "FAILED",
        note: "Withdrawal failed, wallet refunded",
      }
    );

    return res.sendStatus(200);
  }
}

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

    if (isDev) {
  console.log("🔍 Bank transfer resolution", {
    channel: data.channel,
    accountNumber,
    reference: data.reference,
  });
}

  if (accountNumber) {
    user = await User.findOne({
      "paystackDVA.accountNumber": accountNumber,
    });
  }
}

// 3️⃣ FINAL GUARD
if (!user) {
  if (isDev) {
  console.log("❌ User not resolved for Paystack event", {
    channel: data.channel,
    reference: data.reference,
  });
}
  return res.sendStatus(200);
}


      /* -------------------------------------------------
       * 5. FIND OR CREATE WALLET
       * ------------------------------------------------- */
      let wallet = await Wallet.findOne({ userId: user._id });

if (!wallet) {
  console.log("⚠️ Wallet not found for user", user._id);
  return res.sendStatus(200);
}

 const internalNuban = wallet.internalNuban || null;

      /* -------------------------------------------------
       * 6. PREVENT DUPLICATE CREDIT
       * ------------------------------------------------- */
      const existing = await Ledger.findOne({
        reference: data.reference,
        source: "paystack",
      });

      if (existing) {
        if (isDev) {
        console.log("⚠️ Duplicate transaction ignored");
        }
        return res.sendStatus(200);
      }


      let counterpartyName = "Paystack"; // final fallback

if (data.channel === "dedicated_nuban") {
  const senderName = data.authorization?.sender_name?.trim();
  const senderBank = data.authorization?.sender_bank?.trim();

  if (senderName && senderBank) {
    counterpartyName = `${senderName} • ${senderBank}`;
  } else if (senderName) {
    counterpartyName = senderName;
  } else if (senderBank) {
    counterpartyName = senderBank;
  } else {
    counterpartyName = "Bank Transfer";
  }
}

else if (data.channel === "card") {
  counterpartyName = `${data.authorization?.bank || data.authorization?.brand || "Card Payment"}`;
}
else if (data.channel === "ussd") {
  counterpartyName = `${data.authorization?.bank || "USSD / Paystack"}`;
}

if (isDev) {
console.log("WEBHOOK SENDER DEBUG:", {
  channel: data.channel,
  sender_name: data.authorization?.sender_name,
  sender_bank: data.authorization?.sender_bank,
  counterpartyName,
});
}

      /* -------------------------------------------------
       * 7. CREDIT WALLET
       * ------------------------------------------------- */
  const gross = data.amount;      // kobo
  const fee = data.fees || 0;     // kobo
  const net = gross - fee;        // kobo

const amount = net / 100;       // NAIRA (REAL MONEY)

// 🚧 MINIMUM DEPOSIT GUARD
if (amount < MIN_DEPOSIT) {
  if (isDev) {
    console.log("⚠️ Deposit below minimum", {
      amount,
      min: MIN_DEPOSIT,
      reference: data.reference,
    });
  }

  // CREATE LEDGER (but do NOT credit wallet)
  await Ledger.create({
    userId: user._id,
    walletId: wallet._id,
    accountNumber,
    internalNuban,
    type: "CREDIT",
    source: "paystack",
    amount,
    balanceBefore: wallet.balance,
    balanceAfter: wallet.balance, // unchanged
    reference: data.reference,
    status: "PENDING", // IMPORTANT
    narration: "Deposit below minimum threshold",
    metadata: {
      provider: "paystack",
      paidAt: data.paid_at,
      held: true,
      requiredAmount: MIN_DEPOSIT,
    },
  });

  // ACTIVITY LOG (user can see it)
  await ActivityLog.create({
    userId: user._id,
    actorId: user._id,
    walletId: wallet._id,

    category: "DEPOSIT",
    channel: "BANK_TRANSFER",
    type: "DEPOSIT",
    direction: "CREDIT",

    amount,
    reference: data.reference,
    status: "PENDING",
    narration: `Deposit below required minimum. Amount will remain pending and will NOT be credited.`,
    counterpartyName,
  });

  return res.sendStatus(200);
}

      const balanceBefore = wallet.balance;
      wallet.balance += amount;
      await wallet.save();
      const balanceAfter = wallet.balance;

     

      console.log("ACCOUNT NUMBER:", accountNumber);
      console.log("USER FOUND:", true);
      console.log("WALLET FOUND:", true);
      console.log("AMOUNT:", amount);
         
         


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

    } catch (err) {
    
      console.error("❌ LEDGER FAILURE:", err.message);
      
      return res.sendStatus(200); // NEVER fail webhook
    }
  }
);

export default router;