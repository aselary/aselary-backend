import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import crypto from "crypto";
import Ledger from "../models/Ledger.js";
import ActivityLog from "../models/ActivityLog.js";
import { generateInternalRef } from "../utils/generateInternalRef.js";
import isDev from "../utils/isDev.js";


export const initUSSD = async (req, res) => {
  try {
    const { userId, amount, } = req.body;

  if (isDev) {
 console.log("INIT USSD REQUEST:", req.body);
  }
    // Validate fields
    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const pendingTx = await Method.findOne({
  userId,
  status: "pending",
});

if (pendingTx) {
  return res.status(409).json({
    success: false,
    message: "You already have a pending transaction. Please complete or cancel it.",
    pending: {
      method: pendingTx.method,
      amount: pendingTx.amount,
      internalRef: pendingTx.internalRef,
    },
  });
}

    const internalRef = generateInternalRef("USSD");

    // Convert to Kobo
    const koboAmount = amount * 100;

const response = await fetch(
  "https://api.paystack.co/transaction/initialize",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: koboAmount,
      channels: ["ussd"], // or ["card"]
      metadata:{
        internalRef,
      },
    }),
  }
);

const data = await response.json();

if (!data.status) {
  throw new Error(data.message || "Paystack init failed");
}
          if (isDev) {
        console.log("PAYSTACK RAW RESPONSE:", data);
          }
const { reference, authorization_url } = data.data;
    const providerRef = reference;




    // Save pending transaction
    await Method.create({
      userId,
      internalRef,
      providerRef,
      type: "deposit",
      method: "ussd",
      amount,
      status: "pending",
    });

    return res.json({
      success: true,
      internalRef,
      authorization_url,
    });

  } catch (err) {
    if (isDev) {
    console.log("USSD INIT ERROR:", err.response?.data || err);
    }
    return res.status(500).json({
      success: false,
      message: "Failed to initialize USSD payment",
    });
  }
};



// PAYSTACK WEBHOOK HANDLER

export const ussdWebhook = async (req, res) => {
  try {
    /* ----------------------------------------
       1. VERIFY PAYSTACK SIGNATURE (KEEP)
    ----------------------------------------- */
    const secret = process.env.PAYSTACK_SECRET_KEY;

    const hash = crypto
      .createHmac("sha512", secret)
      .update(req.body)
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.sendStatus(401);
    }

    /* ----------------------------------------
       2. PARSE EVENT SAFELY
    ----------------------------------------- */
    const event = JSON.parse(req.body);

    /* ----------------------------------------
       3. HANDLE ONLY SUCCESSFUL USSD PAYMENTS
    ----------------------------------------- */
    if (
      event.event !== "charge.success" ||
      event.data.channel !== "ussd"
    ) {
      return res.sendStatus(200);
    }

    /* ----------------------------------------
       4. EXTRACT REFERENCES
    ----------------------------------------- */
    const providerRef = event.data.reference; // Paystack ref
    const internalRef = event.data.metadata?.internalRef; // YOUR ref

    const amount = event.data.amount / 100;

    if (!internalRef) {
      if (isDev) {
      console.error("Missing internalRef in USSD webhook");
      }
      return res.sendStatus(200);
    }

    /* ----------------------------------------
       5. FIND TRANSACTION (BY INTERNAL REF)
    ----------------------------------------- */
    const tx = await Method.findOne({ internalRef });

    if (!tx) return res.sendStatus(200);
    if (tx.status === "success") return res.sendStatus(200);

    /* ----------------------------------------
       6. MARK TRANSACTION SUCCESS
    ----------------------------------------- */
    tx.status = "success";
    tx.providerRef = providerRef;
    await tx.save();

    /* ----------------------------------------
       7. CREDIT WALLET
    ----------------------------------------- */
    const wallet = await Wallet.findOne({ userId: tx.userId });
    if (!wallet) return res.sendStatus(200);

    const balanceBefore = wallet.balance;
    wallet.balance += amount;
    await wallet.save();

    /* ----------------------------------------
       8. LEDGER ENTRY
    ----------------------------------------- */
    await Ledger.create({
      userId: wallet.userId,
      walletId: wallet._id,

      internalNuban: wallet.internalNuban,
      aliasAccount: wallet.accountNumber,

      type: "CREDIT",
      source: "USSD",

      amount,
      providerRef,
      internalRef,

      balanceBefore,
      balanceAfter: wallet.balance,

      narration: "USSD Deposit",

      meta: {
        channel: "USSD",
        provider: "PAYSTACK",
      },

      status: "SUCCESS",
    });

    /* ----------------------------------------
       9. ACTIVITY LOG
    ----------------------------------------- */
    await ActivityLog.create({
      userId: wallet.userId,
      actorId: wallet.userId,
      walletId: wallet._id,

      category: "DEPOSIT",
      channel: "USSD",
      type: "DEPOSIT",

      title: "USSD Deposit",
      description: `Deposited ₦${amount.toLocaleString()} via USSD`,

      amount,
      internalRef,
      providerRef,

      status: "SUCCESS",

      direction: "CREDIT",
      counterpartyName: "USSD / Paystack",

      meta: {
        method: "USSD",
        provider: "PAYSTACK",
      },
    });

    await Transaction.create({
      userId: wallet.userId,
      actorId: wallet.userId,
      walletId: wallet._id,

      category: "DEPOSIT",
      channel: "USSD",
      type: "DEPOSIT",

      title: "USSD Deposit",
      description: `Deposited ₦${amount.toLocaleString()} via USSD`,

      amount,
      internalRef,
      providerRef,

      status: "SUCCESS",

      direction: "CREDIT",
      counterpartyName: "USSD / Paystack",

      meta: {
        method: "USSD",
        provider: "PAYSTACK",
      },
    });

    return res.sendStatus(200);
  } catch (err) {
    if (isDev) {
    console.error("USSD WEBHOOK ERROR:", err);
    }
    return res.sendStatus(200);
  }
};