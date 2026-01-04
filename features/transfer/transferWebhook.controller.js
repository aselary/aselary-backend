import crypto from "crypto";
import Transaction from "../models/Transaction.js";
import Wallet from "../models/Wallet.js";
import ActivityLog from "../models/ActivityLog.js"; 
import Ledger from "../models/Ledger.js";
import isDev from "../utils/isDev.js";

export const transferWebhook = async (req, res) => {
  try {
  const signature = req.headers["x-paystack-signature"];

let validSignature = false;

if (signature) {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(req.rawBody)
    .digest("hex");

  validSignature = hash === signature;
}

if (!validSignature) {
  if (process.env.NODE_ENV === "development") {
    if (isDev) {
    console.log("DEV MODE: signature bypassed");
    }
  } else {
    return res.status(401).send("Invalid Paystack signature");
  }
}

    // ✅ Parse body AFTER verification
    const event = JSON.parse(req.body.toString());

    // 🚫 Ignore unrelated events
   if (
      event.event !== "charge.success" &&
      event.event !== "transfer.success"
    ) {
        return res.sendStatus(200);
  }

  const validEvents = ["charge.success", "transfer.success"];

if (!validEvents.includes(event.event)) {
  return res.sendStatus(200);
}

    const { reference, amount, metadata } = event.data;

    // 🧠 Idempotency check
    const txn = await Transaction.findOne({ reference });
    if (!txn) return res.sendStatus(200);
    if (txn.status === "success") return res.sendStatus(200);

    // ✅ Mark transaction successful
    txn.status = "success";
    await txn.save();

    // 💰 Credit wallet
    const wallet = await Wallet.findOne({ userId: txn.userId });
    if (!wallet) return res.sendStatus(200);

    const amountNaira = amount / 100; // Paystack sends kobo
    const balanceBefore = wallet.balance

    wallet.balance += amountNaira
    await wallet.save();
     
    if (isDev) {
    console.log("WALLET CREDITED:", amountNaira);
    }
      
await Ledger.create({
  userId: wallet.userId,
  walletId: wallet._id,

  internalNuban: wallet.internalNuban,
  aliasAccount: wallet.accountNumber,

  type: "CREDIT",
  source: "BANK_TRANSFER",

  amount: amountNaira,
  reference,

  balanceBefore,
  balanceAfter: wallet.balance,

  narration: "Bank Transfer Deposit",

  meta: {
    channel: "BANK_TRANSFER",
    provider: "PAYSTACK",
  },

  status: "SUCCESS",
});

await ActivityLog.create({
  userId: wallet.userId,
  actorId: userId, // ✅ FIX
  walletId: wallet._id,

  category: "DEPOSIT",
  channel: "TRANSFER",

  type: "DEPOSIT",
  title: "Bank Transfer Deposit",

  description: `Deposited ₦${amountNaira.toLocaleString()} via Bank Transfer`,

  amount: amountNaira,
  reference,

  status: "SUCCESS",


  // ✅ ADD THESE TWO (VERY IMPORTANT)
  direction: "CREDIT",
  counterpartyName: senderName || "External Bank Transfer",

  meta: {
    method: "BANK_TRANSFER",
    provider: "PAYSTACK",
  },
});

await Transaction.create({
  userId: wallet.userId,
  actorId: wallet.userId,
  walletId: wallet._id,

  type: "BANK_TRANSFER",
  category: "DEPOSIT",
  channel: "BANK_TRANSFER",

  direction: "CREDIT",

  amount: amountNaira,
  fee: 0,
  netAmount: amountNaira,

  status: "SUCCESS",
  reference,

  title: "Bank Transfer Deposit",
  description: `Credited ₦${amountNaira.toLocaleString()} via Bank Transfer`,

  counterpartyName: senderName || "External Bank Transfer",

  meta: {
    method: "BANK_TRANSFER",
    provider: "PAYSTACK",
  },

  source: "BANK_TRANSFER",
  createdAt: new Date(),
});

    return res.sendStatus(200);
  } catch (err) {
    if (isDev) {
    console.error("TRANSFER WEBHOOK ERROR:", err);
    }
    return res.sendStatus(200); // never fail webhook
  }
};