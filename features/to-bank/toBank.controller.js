import mongoose from "mongoose";
import Wallet from "../models/Wallet.js";
import Ledger from "../models/Ledger.js";
import ToBankTransaction from "../models/ToBankTransaction.js";
import ActivityLog from "../models/ActivityLog.js";
import Transaction from "../models/Transaction.js";
import addPlatformFee from "../utils/addPlatformFee.js";
import { calculateFee } from "../utils/calculateFee.js";
import { TO_BANK_FEES } from "../../config/fee.js";
import { LIMITS } from "../../config/limits.js";
import { getDailyTransferTotal } from "../utils/getDailyTransferTotal.js";
import isDev from "../utils/isDev.js";

export const toBankTransfer = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    const userId = req.user.id;
    const {
      amount,
      bankName,
      bankCode,
      accountNumber,
      accountName,
      narration,
    } = req.body;

    // 1️⃣ Validate input
    if (
      !amount ||
      !bankName ||
      !bankCode ||
      !accountNumber ||
      !accountName 
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
  

   if (!Number(amount) || Number(amount) <= 0) {
  return res.status(400).json({ message: "Invalid amount" });
 }

  try {
        // 4️⃣ Generate reference
    const reference = `TB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const existing = await ToBankTransaction.findOne({
  userId,
  status: "PENDING",
   }).session(session);

    if (existing) {
  return res.status(400).json({
    message: "You have a pending transfer. Please wait.",
  });
 }

    const fee = calculateFee(amount, TO_BANK_FEES);
    const totalDebit = amount + fee;


// 1️⃣ Per-transaction limit
if (amount > LIMITS.TO_BANK.maxPerTransaction) {
  return res.status(400).json({
    message: `To Bank limit is ₦${LIMITS.TO_BANK.maxPerTransaction.toLocaleString()} per transaction`,
  });
}
   const dailyTotal = await getDailyTransferTotal({
  userId,
  type: "TO_BANK",
});

if (dailyTotal + amount > LIMITS.TO_BANK.maxDailyTotal) {
  return res.status(403).json({
    message: `Daily to-bank limit is ₦${LIMITS.TO_BANK.maxDailyTotal.toLocaleString()}`,
  });
}

const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);

const sameBankCount = await Transaction.countDocuments({
  userId,
  type: "TO_BANK",
  status: "SUCCESS",
  bankCode,
  accountNumber,
  createdAt: { $gte: startOfDay },
});

if (sameBankCount >= LIMITS.TO_BANK.maxSameBankPerDay) {
  return res.status(403).json({
    message: `You can only send to this bank account ${LIMITS.TO_BANK.maxSameBankPerDay} times per day`,
  });
}

if (amount >= LIMITS.TO_BANK.cooldown.thresholdAmount) {
  const lastBigTransfer = await Transaction.findOne({
    userId,
    type: "TO_BANK",
    status: "SUCCESS",
    amount: { $gte: LIMITS.TO_BANK.cooldown.thresholdAmount },
  }).sort({ createdAt: -1 });

  if (lastBigTransfer) {
    const diffMinutes =
      (Date.now() - lastBigTransfer.createdAt.getTime()) / 60000;

    if (diffMinutes < LIMITS.TO_BANK.cooldown.minutes) {
      return res.status(429).json({
        message: `Please wait ${LIMITS.TO_BANK.cooldown.minutes} minutes before another large withdrawal`,
      });
    }
  }
}

    // 2️⃣ Fetch wallet
    const wallet = await Wallet.findOne({ userId }).select('+internalNuban').session(session);

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // 3️⃣ Balance check
    if (wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }



    // 8️⃣ Create ToBank Transaction (PENDING)
    const toBankTxn = new ToBankTransaction({
      userId,
      walletId: wallet._id,
      amount,
      fee,
      totalDebit,
      bankName,
      bankCode,
      accountNumber,
      accountName,
      narration,
      reference,
      status: "PENDING",
    });

    await toBankTxn.save({ session });

  await ActivityLog.create(
  [
    {
      userId,
      actorId: userId, // ✅ FIX
      walletId: wallet._id,

      category: "TRANSFER",
      channel: "BANK_TRANSFER",
      type: "TO_BANK",

      title: "Transfer to Bank",
      description: `Sending ₦${amount} to ${accountName}`,

      amount,
      reference,
      status: "PENDING",

      // ✅ NEW (authoritative meaning)
      direction: "OUTGOING",
      counterpartyName: accountName,

      // 🧱 OLD (kept, very important)
      meta: {
        bankName,
        bankCode,
        accountNumber,
        accountName,
        narration,
      },
    },
  ],
  { session }
);


await Transaction.create(
  [
    {
      userId,
      actorId: userId,
      walletId: wallet._id,

      type: "TO_BANK",
      category: "TRANSFER",
      channel: "BANK_TRANSFER",

      direction: "OUTGOING",

      amount,
      fee: fee || 0,
      netAmount: amount - (fee || 0),

      status: "PENDING",
      reference,

      title: "Transfer to Bank",
      description: `Sending ₦${amount} to ${accountName}`,

      counterpartyName: accountName,

      // 🔒 Bank snapshot (VERY IMPORTANT)
      meta: {
        bankName,
        bankCode,
        accountNumber,
        accountName,
        narration,
      },

      source: "TO_BANK",
      createdAt: new Date(),
    },
  ],
  { session }
);

    // 9️⃣ Commit
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Transfer to bank initiated",
      data: {
        reference,
        narration,
        amount,
        status: "PENDING",
        createdAt: toBankTxn.createdAt,
        updatedAt: toBankTxn.updatedAt,
      },
    });
   } catch (error) {
  // 1️⃣ Abort transaction safely
  await session.abortTransaction();
  session.endSession();

  if (isDev) {
  console.error("TO BANK ERROR:", error);
  }

  // 2️⃣ AUTO-FAIL pending transfer (if reference was generated)
  if (reference) {
    await ToBankTransaction.findOneAndUpdate(
      { reference, status: "PENDING" },
      {
        status: "FAILED",
        failureReason: error.message || "Initialization error",
        completedAt: new Date(),
      }
    );

    await ActivityLog.findOneAndUpdate(
      { reference },
      {
        status: "FAILED",
        reason: error.message || "Initialization error",
        completedAt: new Date(),
      }
    );
  }

  // 3️⃣ Respond to client
  return res.status(500).json({
    message: "Internal server error",
  });
}
};



export const completeToBankTransfer = async (req, res) => {
  const { reference } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    
    const tx = await ToBankTransaction.findOne({ reference }).session(session);

    if (!tx) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (tx.status !== "PENDING") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Transaction already resolved" });
    }

    
    const wallet = await Wallet.findById(tx.walletId)
      .select("balance internalNuban accountNumber")
      .session(session);

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    
    const balanceBefore = wallet.balance;
    const fee = tx.fee || 0;
    const totalDebit = tx.amount + fee;

    if (wallet.balance < totalDebit) {
      throw new Error("Insufficient balance");
    }

    
    wallet.balance -= totalDebit;
    await wallet.save({ session });

    const balanceAfter = wallet.balance;

    await Ledger.create(
      {
        userId: tx.userId,
        walletId: wallet._id,
        internalNuban: wallet.internalNuban,
        accountNumber: wallet.accountNumber,
        type: "DEBIT",
        source: "TO_BANK",
        amount: tx.amount,
        balanceBefore,
        balanceAfter: balanceBefore - tx.amount,
        narration: tx.narration,
        reference,
      },
      { session }
    );

    
    if (fee > 0) {
      await Ledger.create(
        {
          userId: tx.userId,
          walletId: wallet._id,
          internalNuban: wallet.internalNuban,
          type: "DEBIT",
          source: "TO_BANK_FEE",
          amount: fee,
          balanceBefore: balanceBefore - tx.amount,
          balanceAfter: balanceBefore - totalDebit,
          narration: "Transfer service fee",
          reference,
        },
        { session }
      );

      
      await addPlatformFee(
        {
          source: "TO_BANK",
          amount: fee,
          reference,
          userId: tx.userId,
          narration: "To Bank transfer service fee",
          direction: "CREDIT",
          createdAt: new Date(),
        },
        session
      );
    }

    
    tx.status = "SUCCESS";
    tx.completedAt = new Date();
    await tx.save({ session });

    
    await ActivityLog.findOneAndUpdate(
      { reference },
      { status: "SUCCESS", completedAt: new Date() },
      { session }
    );

 
    await Transaction.findOneAndUpdate(
      { reference, status: "PENDING", type: "TO_BANK" },
      { status: "SUCCESS", completedAt: new Date() },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      message: "Transfer settled successfully",
      reference,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
     if (isDev) {
    console.error("COMPLETE TO BANK ERROR:", error);
     }

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const failToBankTransfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reference, reason = "Bank transfer failed" } = req.body;

    const tx = await ToBankTransaction
      .findOne({ reference })
      .session(session);

    if (!tx) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (tx.status !== "PENDING") {
      return res.status(400).json({
        message: "Transaction already resolved",
      });
    }

    // Mark failed
    tx.status = "FAILED";
    tx.failedAt = new Date();
    tx.failureReason = reason;
    await tx.save({ session });

    await ActivityLog.findOneAndUpdate(
      { reference },
      {
        status: "FAILED",
        reason,
        completedAt: new Date(),
      },
      { session }
    );

    await Transaction.findOneAndUpdate(
      { reference },
      {
        status: "FAILED",
        reason,
        completedAt: new Date(),
      },
      { session }
    );

    await session.commitTransaction();

    return res.json({
      success: true,
      message: "Transfer failed",
      reference,
    });
  } catch (err) {
    await session.abortTransaction();
    return res.status(500).json({
      message: "Internal server error",
    });
  } finally {
    session.endSession();
  }
};