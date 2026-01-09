import mongoose from "mongoose";
import Wallet from "../models/Wallet.js";
import Transacting from "../models/Transacting.js";
import User from "../models/User.js";
import Ledger from "../models/Ledger.js";
import PlatformLedger from "../models/PlatformLedger.js";
import ActivityLog from "../models/ActivityLog.js";
import Transaction from "../models/Transaction.js";
import addPlatformFee from "../utils/addPlatformFee.js";
import { calculateFee } from "../utils/calculateFee.js";
import { A2A_FEES } from "../../config/fee.js";
import { LIMITS } from "../../config/limits.js";
import { getDailyTransferTotal } from "../utils/getDailyTransferTotal.js";
import isDev from "../utils/isDev.js";

export const a2aTransfer = async (req, res) => {

  const session = await mongoose.startSession();

  try {
    const senderId = req.user.id;
    const { receiverAccountNumber, amount } = req.body;

    // 1️⃣ Validate input
    if (!receiverAccountNumber || !amount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

        // 8️⃣ Start transaction
    session.startTransaction();
     
    // 🔹 Calculate A2A fee
      const fee = calculateFee(amount, A2A_FEES);
      const totalDebit = amount + fee;



          // 2️⃣ Fetch sender user
    const senderUser = await User.findById(senderId);
    if (!senderUser) {
      return res.status(404).json({ message: "Sender user not found" });
    }

    // 3️⃣ Fetch sender wallet
    const senderWallet = await Wallet.findOne({ userId: senderId })
    .select("+internalNuban");
    if (!senderWallet) {
      return res.status(404).json({ message: "Sender wallet not found" });
    }

    // 4️⃣ Fetch receiver wallet  ✅ MUST COME BEFORE ANY USE
    const receiverWallet = await Wallet.findOne({
      accountNumber: receiverAccountNumber,
    })
    .select("+internalNuban");

    if (!receiverWallet) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // 5️⃣ Prevent self transfer (NOW SAFE)
    if (receiverWallet.userId.toString() === senderId.toString()) {
      return res.status(400).json({ message: "Cannot transfer to yourself" });
    }

    // 6️⃣ Balance check
    if (senderWallet.balance < totalDebit) {
      return res.status(400).json({ message:  `Insufficient balance. You need ₦${totalDebit}` });
    }

    // 7️⃣ Fetch receiver user (NOW receiverWallet exists)
    const receiverUser = await User.findById(receiverWallet.userId);
    if (!receiverUser) {
      return res.status(404).json({ message: "Receiver user not found" });
    }

      const reference = `A2A-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const debitLedgerRef = `${reference}-DEBIT`;
      const creditLedgerRef = `${reference}-CREDIT`;


if (amount > LIMITS.A2A.maxPerTransaction) {
  return res.status(400).json({
    message: `A2A transfer limit is ₦${LIMITS.A2A.maxPerTransaction.toLocaleString()} per transaction`,
  });
}

const dailyTotal = await getDailyTransferTotal({
  userId: senderId,
  type: "A2A",
});

if (dailyTotal + amount > LIMITS.A2A.maxDailyTotal) {
  return res.status(403).json({
    message: "Daily A2A transfer limit exceeded",
  });
}

const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);

const sentToSameUserToday = await Transaction.countDocuments({
  userId: senderId,
  type: "A2A",
  receiverId: receiverWallet.userId,
  status: "SUCCESS",
  createdAt: { $gte: startOfDay },
});

if (sentToSameUserToday >= LIMITS.A2A.maxSameReceiverPerDay) {
  return res.status(403).json({
    message: `You can only send to this user ${LIMITS.A2A.maxSameReceiverPerDay} times per day`,
  });
}

// 🔒 COOLDOWN FOR BIG A2A TRANSFERS
if (amount >= LIMITS.A2A.cooldown.thresholdAmount) {
  const lastBigTransfer = await Transaction.findOne({
    userId: senderId,
    type: "A2A",
    status: "SUCCESS",
    amount: { $gte: LIMITS.A2A.cooldown.thresholdAmount },
  }).sort({ createdAt: -1 });

  if (lastBigTransfer) {
    const diffMinutes =
      (Date.now() - lastBigTransfer.createdAt.getTime()) / 60000;

    if (diffMinutes < LIMITS.A2A.cooldown.minutes) {
      return res.status(429).json({
        message: `Please wait ${LIMITS.A2A.cooldown.minutes} minutes before another large A2A transfer`,
      });
    }
  }
}

    
    // ✅ SNAPSHOT BALANCES (DO NOT TOUCH WALLET YET)
const senderBalanceBefore = senderWallet.balance;
const receiverBalanceBefore = receiverWallet.balance;

 // ✅ CALCULATE NEW BALANCES
const senderBalanceAfter = senderBalanceBefore - totalDebit;
const receiverBalanceAfter = receiverBalanceBefore + amount;


// ✅ APPLY WALLET UPDATES
senderWallet.balance = senderBalanceAfter;
receiverWallet.balance = receiverBalanceAfter;

await senderWallet.save({ session });
await receiverWallet.save({ session });
// 🏦 PLATFORM FEE CREDIT (A2A)
await addPlatformFee(
  {
    amount: fee,
    reference,
    source: "A2A",
    narration: "A2A transfer service fee",
    fromUserId: senderWallet.userId,
  },
  session
);

await PlatformLedger.create(
  [
    {
      reference,
      source: "A2A",
      type: "PLATFORM_FEE",
      direction: "CREDIT",
      amount: fee,
      narration: "A2A transfer service fee",
      meta: {
        fromUserId: senderWallet.userId,
        userId: receiverWallet.userId,
      },
    },
  ],
  { session }
);
  
    // 🔐 INTERNAL NUBAN VALIDATION (SAFE POSITION)
if (
  !senderWallet.internalNuban ||
  typeof senderWallet.internalNuban !== "string" ||
  !receiverWallet.internalNuban ||
  typeof receiverWallet.internalNuban !== "string"
) {
  await session.abortTransaction();
  session.endSession();
  return res.status(500).json({
    message: "Internal NUBAN validation failed",
  });
}


   const debitLedger = new Ledger({
  userId: senderWallet.userId,
  walletId: senderWallet._id,
  internalNuban: senderWallet.internalNuban,
  accountNumber: senderWallet.accountNumber,
  type: "DEBIT",
  source: "A2A",
  amount,
  balanceBefore: senderBalanceBefore,
  balanceAfter: senderBalanceAfter,
  reference: debitLedgerRef,
  narration: `A2A transfer to ${receiverWallet.accountNumber}`,
  meta: {
    toUserId: receiverWallet.userId,
    toAccount: receiverWallet.accountNumber,
  },
});

await debitLedger.save({ session });


 const creditLedger = new Ledger({
  userId: receiverWallet.userId,
  walletId: receiverWallet._id,
  internalNuban: receiverWallet.internalNuban,
  accountNumber: receiverWallet.accountNumber,
  type: "CREDIT",
  source: "A2A",
  amount,
  balanceBefore: receiverBalanceBefore,
  balanceAfter: receiverBalanceAfter,
  reference: creditLedgerRef,
  narration: `A2A transfer from ${senderWallet.accountNumber}`,
  meta: {
    fromUserId: senderWallet.userId,
    fromAccount: senderWallet.accountNumber,
  },
});

await creditLedger.save({ session });

  await ActivityLog.create(
  [
   {
  userId: senderWallet.userId,
  actorId: senderWallet.userId, // ✅ FIX
  walletId: senderWallet._id,

  category: "A2A",
  channel: "A2A",
  type: "A2A",

  title: "Transfer Sent",
  description: `Sent ₦${amount} to ${receiverWallet.accountNumber}`,

  amount,
  reference: debitLedgerRef,
  status: "SUCCESS",

  // ✅ NEW (authoritative)
  direction: "DEBIT",
  counterpartyUserId: receiverWallet.userId,
  counterpartyName: receiverUser.fullName,

  // 🧱 OLD (kept for safety)
  meta: {
    direction: "DEBIT",
    toUserId: receiverWallet.userId,
    toAccount: receiverWallet.accountNumber,
  },
},
    {
  userId: receiverWallet.userId,
  actorId: receiverWallet.userId, // ✅ FIX
  walletId: receiverWallet._id,

  category: "A2A",
  channel: "A2A",
  type: "A2A",

  title: "Transfer Received",
  description: `Received ₦${amount} from ${senderWallet.accountNumber}`,

  amount,
  reference: creditLedgerRef,
  status: "SUCCESS",

  // ✅ NEW (authoritative)
  direction: "CREDIT",
  counterpartyUserId: senderWallet.userId,
  counterpartyName: senderUser.fullName,

  // 🧱 OLD (kept for safety)
  meta: {
    direction: "CREDIT",
    fromUserId: senderWallet.userId,
    fromAccount: senderWallet.accountNumber,

      },
    },
  ],
  { session, ordered: true }
);

    await Transacting.create(
      [
        {
          type: "A2A",
          senderId,
          receiverId: receiverWallet.userId,
          amount,
          reference,
          status: "success",
        },
      ],
      { session, ordered: true }
    );

    await Transaction.create([
  {
    userId: senderWallet.userId,
    actorId: senderWallet.userId,
    walletId: senderWallet._id,

    type: "A2A",
    category: "A2A",
    channel: "A2A",

    direction: "DEBIT",
    amount,
    fee,
    netAmount: amount,

    status: "SUCCESS",
    reference: debitLedgerRef,

    counterpartyUserId: receiverWallet.userId,
    counterpartyName: receiverUser.fullName,

    title: "Transfer Sent",
    description: `Sent ₦${amount} to ${receiverUser.fullName}`,

    source: "A2A",
    createdAt: new Date()
  },
  {
    userId: receiverWallet.userId,
    actorId: receiverWallet.userId,
    walletId: receiverWallet._id,

    type: "A2A",
    category: "A2A",
    channel: "A2A",

    direction: "CREDIT",
    amount,
    fee: 0,
    netAmount: amount,

    status: "SUCCESS",
    reference: creditLedgerRef,

    counterpartyUserId: senderWallet.userId,
    counterpartyName: senderUser.fullName,

    title: "Transfer Received",
    description: `Received ₦${amount} from ${senderUser.fullName}`,

    source: "A2A",
    createdAt: new Date()
  }
], { session, ordered: true });

    await session.commitTransaction();
    session.endSession();

    // 9️⃣ Receipt
    const receipt = {
      receiptId: `ASL-${Date.now()}`,
      type: "A2A_TRANSFER",
      status: "SUCCESS",
      sender: {
        id: senderId,
        name: senderUser.fullName,
        accountNumber: senderWallet.accountNumber,
      },
      receiver: {
        id: receiverWallet.userId,
        name: receiverUser.fullName,
        accountNumber: receiverWallet.accountNumber,
      },
      amount,
      fee,
      total: amount + fee,
      reference,
      narration: "Aselary A2A Transfer",
      createdAt: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      receipt,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
     
    if (isDev) {
    console.error("A2A TRANSFER ERROR:", error);
    }

    return res.status(500).json({
      message: "Transfer failed, try again",
    });
  }
};