import mongoose from "mongoose";
import Wallet from "../models/Wallet.js";
import Ledger from "../models/Ledger.js";
import ToBankTransaction from "../models/ToBankTransaction.js";
import ActivityLog from "../models/ActivityLog.js";
import Transaction from "../models/Transaction.js";
import addPlatformFee from "../utils/addPlatformFee.js";
import PlatformLedger from "../models/PlatformLedger.js";
import { calculateFee } from "../utils/calculateFee.js";
import { TO_BANK_FEES } from "../../config/fee.js";
import { LIMITS } from "../../config/limits.js";
import { getDailyTransferTotal } from "../utils/getDailyTransferTotal.js";
import { createTransferRecipient } from "../transfer/createRecipient.js";
import { initiatePaystackTransfer } from "../transfer/initiateTransfer.js";
import isDev from "../utils/isDev.js";
import { paystackRequest }from "../utils/paystack.js";
import Plan from "../models/Plan.js";

export const withdrawFunds = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    const userId = req.user.id;
    const {
      amount,
      narration,
      planId ,
    } = req.body;

     if (isDev) {
 console.log("🟡 RAW req.body:", req.body);
    console.log("🟡 planId from body:", planId);
    console.log("🟡 typeof planId:", typeof planId);
  }
    
    if (isDev) {
 console.log("📦 STEP 1: BODY", {
  amount,
  narration,
});
    }

  if (!planId) {
  await session.abortTransaction();
  session.endSession();
  return res.status(400).json({
    message: "planId is required",
  });
}

const plan = await Plan.findOne({
  _id: planId,
  userId,
}).session(session);



if (!plan) {
  await session.abortTransaction();
  session.endSession();
  return res.status(404).json({
    message: "Savings plan not found or does not belong to user",
  });
}



if (isDev) {
  console.log("✅ RESOLVED PLAN:", {
    planId,
    status: plan.status,
    balance: plan.balance,
  });
}
    if (isDev) {
    console.log("👛 STEP 5 RESULT: plan =", plan);
    }



 
    if (plan.status === "archived") {
  return res.status(410).json({
    message: "This plan has been archived"
  });
}

if (isDev) {
console.log("PLAN WITHDRAW ACCOUNT:", plan.withdrawalAccount);
}
    if (!plan.withdrawalAccount || !plan.withdrawalAccount.accountNumber) {
  await session.abortTransaction()
  session.endSession()
  return res.status(400).json({
    message: "No withdrawal account saved for this plan"
  })
}


const bankName = plan.withdrawalAccount.bankName
const bankCode = plan.withdrawalAccount.bankCode
const accountNumber = plan.withdrawalAccount.accountNumber
const accountName = plan.withdrawalAccount.accountName

 if (
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

         // 4️⃣ Generate reference
   const reference = `WF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
   if (isDev) {
   console.log("🔖 STEP 2: REFERENCE =", reference);
console.log("🔍 STEP 3: Checking pending transaction...");
   }

    const fee = calculateFee(amount, TO_BANK_FEES);
    const totalDebit = amount + fee;
    if (isDev) {
     console.log("💸 STEP 4: fee & totalDebit", { fee, totalDebit });
    }

// 1️⃣ Per-transaction limit
if (amount > LIMITS.TO_BANK.maxPerTransaction) {
  return res.status(400).json({
    message: `Withdraw Fnds limit is ₦${LIMITS.TO_BANK.maxPerTransaction.toLocaleString()} per transaction`,
  });
}
   const dailyTotal = await getDailyTransferTotal({
  userId,
  type: "WITHDRAW_FUND",
});

if (dailyTotal + amount > LIMITS.TO_BANK.maxDailyTotal) {
  return res.status(403).json({
    message: `Daily withdraw-fund limit is ₦${LIMITS.TO_BANK.maxDailyTotal.toLocaleString()}`,
  });
}

const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);

const sameBankCount = await Transaction.countDocuments({
  userId,
  type: "WITHDRAW_FUND",
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
    type: "WITHDRAW_FUND",
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


if (isDev) {
   console.log("👛 STEP 5: Fetching wallet for userId =", userId);
}
    // 2️⃣ Fetch wallet
    const wallet = await Wallet.findOne({ userId }).select('+internalNuban').session(session);

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }
    if (isDev) {
    console.log("👛 STEP 5 RESULT: wallet =", wallet);
    }

  console.log("DEBUG userId:", userId);



if (isDev) {
  console.log("✅ RESOLVED PLAN:", {
    planId,
    status: plan.status,
    balance: plan.balance,
  });
}
    if (isDev) {
    console.log("👛 STEP 5 RESULT: plan =", plan);
    }


    // 3️⃣ Balance check
    if (plan.balance < totalDebit) {
      return res.status(400).json({ message: `Insufficient balance. You need ₦${totalDebit}` });
    }


try {
    const existing = await ToBankTransaction.findOne({
  planId,
  status: "PENDING",
   }).session(session);

    if (existing) {
  return res.status(400).json({
    message: "You have a pending transfer. Please wait.",
  });
 }
 if (isDev) {
 console.log("📌 STEP 3 RESULT: existing =", existing);
 }


    const withdrawFundTxn = await ToBankTransaction.create(
  [{
    userId,
    walletId: wallet._id,    
    planId: plan._id,      // 🔥 REQUIRED
    amount,
    fee,
    totalDebit,
    bankName,
    bankCode,
    accountNumber,
    accountName,
    reference,
    status: "PENDING",
  }],
  { session }
);

if (isDev) {
console.log("🔥 RECIPIENT PAYLOAD", {
  accountName,
  accountNumber,
  bankCode,
});
}


const recipientCode = await createTransferRecipient({
  name: accountName,
  accountNumber,
  bankCode,
});

if (!recipientCode) {
  throw new Error("Failed to create Paystack recipient");
}

 const init = await initiatePaystackTransfer({
  amount,
  recipientCode,
  reference,
  reason: narration,
});



  if (isDev) {
console.log("📒 STEP 6: Creating ActivityLog...");
  }
  await ActivityLog.create(
  [
    {
      userId,
      actorId: userId, // ✅ FIX
      planId: plan._id,
      walletId: wallet._id,

      category: "PLAN",
      channel: "WITHDRAW_FUND",
      type: "WITHDRAW_FUND",

      title: "Transfer to Bank",
      description: `Sending ₦${amount} to ${accountName}`,

      amount,
      reference,
      status: "PENDING",

      // ✅ NEW (authoritative meaning)
      direction: "DEBIT",
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
if (isDev) {
console.log("✅ STEP 6 DONE: ActivityLog created");
}

await Transaction.create(
  [
    {
      userId,
      actorId: userId,
      walletId: wallet._id,
      planId: plan._id,

      type: "WITHDRAW_FUND",
      category: "PLAN",
      channel: "WITHDRAW_FUND",

      direction: "DEBIT",

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

      source: "WITHDRAW_FUND",
      createdAt: new Date(),
    },
  ],
  { session }
);

if (init.requiresOtp) {
  // 1️⃣ Update ONLY what is needed for OTP
  await ToBankTransaction.findOneAndUpdate(
    { reference },
    {
      status: "OTP_REQUIRED",
      transferCode: init.transferCode,
      requiresOtp: true,
    },
    { session }
  );

  await ActivityLog.findOneAndUpdate(
    { reference },
    { status: "PENDING" },
    { session }
  );

  await session.commitTransaction();
  session.endSession();

  // ⛔ ABSOLUTE STOP
  return res.status(200).json({
    success: true,
    message: "OTP required to complete transfer",
    data: {
      reference,
      requiresOtp: true,
    },
  });
}

    // 9️⃣ Commit
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Transfer initiated",
      data: {
        reference,
        narration,
        amount,
        status: "PENDING",
        createdAt: withdrawFundTxn.createdAt,
        updatedAt: withdrawFundTxn.updatedAt,
      },
    });
   } catch (error) {

   if (isDev) {
     console.error("🔥 WITHDRAW_FUND CRASHED");
  console.error("❌ MESSAGE:", error?.message);
  console.error("❌ STACK:", error?.stack);
   }
   
  
  // 1️⃣ Abort transaction safely
  await session.abortTransaction();
  session.endSession();

  if (isDev) {
  console.error("WITHDRAW_FUND ERROR:", error);
  }


  // 3️⃣ Respond to client
  return res.status(500).json({
    message: "Internal server error",
  });
}
};




export const completeWithdrawFund = async (req, res) => {
  const { reference } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();
    if (isDev) {
  console.log("[COMPLETE_WITHDRAW_FUND] START", { reference });
    }
  try {
    
    const wf = await ToBankTransaction.findOne({ reference }).session(session);
    if (isDev) {
    console.log("[COMPLETE_WITHDRAW_FUND] WF FOUND", {
  id: wf?._id,
  status: wf?.status,
  amount: wf?.amount,
  fee: wf?.fee,
  walletId: wf?.walletId,
});
}


    if (!wf) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Transaction not found" });
    }

     if (wf.status !== "OTP_VERIFIED") {
  await session.abortTransaction();
  session.endSession();
  return res.status(400).json({
    message: "OTP not verified",
  });
}
     if (isDev) {
    console.log("[COMPLETE_WITHDRAW_FUND] STATUS CHECK PASSED", wf.status);
     }
   if (!["OTP_VERIFIED", "PENDING"].includes(wf.status)) {
  await session.abortTransaction();
  session.endSession();
  return res.status(400).json({
    message: "Transaction already resolved"
  });
}


    const wallet = await Wallet.findById(wf.walletId)
      .select("balance internalNuban accountNumber")
      .session(session);

     const plan = await Plan.findById(wf.planId).session(session);

    if (!plan) {
       throw new Error("Plan not found");
      }
   if (isDev) {
    console.log("[COMPLETE_EARLY_WITHDRAW] WALLET FOUND", {
  planId: plan?._id,
  balance: plan?.balance,
});
   }

    
    const balanceBefore = wallet.balance;
    const fee = wf.fee || 0;
    const totalDebit = wf.amount + fee;

    if (plan.balance < totalDebit) {
      throw new Error("Insufficient balance");
    }

    
    plan.balance -= totalDebit;
    if (isDev) {
    console.log("[COMPLETE_WITHDRAW_FUND] DEBIT CALC", {
  balanceBefore,
  amount: wf.amount,
  fee,
  totalDebit,
});
    }
     await plan.save({ session });

    if (plan.balance <= 0) {
  plan.status = "completed";
  plan.withdrawLocked = false;
  await plan.save({ session });
}

    if (isDev) {
    console.log("[COMPLETE_EARLY_WITHDRAW] WALLET DEBITED", {
  balanceAfter: plan.balance,
});
    }

    const balanceAfter = plan.balance;

   await Ledger.create(
  [
    {
      userId: wf.userId,
      walletId: wallet._id,
      planId: plan._id,
      internalNuban: wallet.internalNuban,
      accountNumber: wallet.accountNumber,
      type: "DEBIT",
      source: "PLAN_WITHDRAW_FUND",
      amount: wf.amount,
      balanceBefore,
      balanceAfter,
      narration: wf.narration,
      reference,
    }
  ],
  { session }
);

    
    if (fee > 0) {
      if (isDev) {
    console.log("[COMPLETE_WITHDRAW_FUND FEE PROCESSED", { fee });
      }
      await Ledger.create(
      [
         {
          userId: wf.userId,
          planId: plan._id,
          walletId: wallet._id,
          internalNuban: wallet.internalNuban,
          type: "DEBIT",
          source: "PLAN_WITHDRAW_FUND",
          amount: fee,
          balanceBefore: balanceAfter,
          balanceAfter: balanceAfter,
          narration: "Transfer service fee",
          reference,
        },
      ],
        { session }
      );

      
      await addPlatformFee(
        {
          source: "WITHDRAW_FUND",
          amount: fee,
          reference,
          userId: wf.userId,
          narration: "Withdrawal funds fee",
          direction: "CREDIT",
          createdAt: new Date(),
        },
        session
      );
    }
   await PlatformLedger.create(
  [
    {
      reference,
      source: "WITHDRAW_FUND",
      type: "WITHDRAW_FEE",
      direction: "CREDIT",
      amount: fee,
      narration: "Withdrawal funds fee",
      meta: {
        userId: wf.userId,
      },
    },
  ],
  { session }
);
 
    
    wf.status = "SUCCESS";
    if (isDev) { 
    console.log("[COMPLETE_WITHDRAW_FUND] SETTING WF SUCCESS");
    }
    wf.completedAt = new Date();
    await wf.save({ session });


    await ActivityLog.findOneAndUpdate(
      { reference },
      { status: "SUCCESS", completedAt: new Date() },
      { session }
    );

 
    await Transaction.findOneAndUpdate(
      { reference, status: "PENDING", type: "WITHDRAW_FUND" },
      { status: "SUCCESS", completedAt: new Date() },
      { session }
    );

    await session.commitTransaction();
    if (isDev) {
    console.log("[COMPLETE_WITHDRAW_FUND] COMMITTING TRANSACTION");
          }
    session.endSession();

    return res.json({
      success: true,
      message: "Withdrawal settled successfully",
      reference,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
     if (isDev) {
    console.error("COMPLETE WITHDRAW FUND ERROR:", error);
     }
     

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};



export const failWithdrawFund = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reference, reason = "Bank transfer failed" } = req.body;

    const wf = await ToBankTransaction
      .findOne({ reference })
      .session(session);

    if (!wf) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (wf.status !== "PENDING") {
      return res.status(400).json({
        message: "Transaction already resolved",
      });
    }

    // Mark failed
    wf.status = "FAILED";
    wf.failedAt = new Date();
    wf.failureReason = reason;
    await wf.save({ session });

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




export const verifyWithdrawFundOtp = async (req, res) => {
  const { reference, otp } = req.body;

  if (!reference || !otp) {
    return res.status(400).json({
      message: "Reference and OTP are required",
    });
  }

  try {
    // 1️⃣ Find transaction
    const wf = await ToBankTransaction.findOne({ reference });

    if (!wf) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    // 2️⃣ Guard: must be waiting for OTP
    if (wf.status !== "OTP_REQUIRED") {
      return res.status(400).json({
        message: "Transaction not awaiting OTP",
      });
    }

    if (!wf.transferCode) {
      return res.status(400).json({
        message: "Missing transfer code",
      });
    }

    // 3️⃣ Call Paystack to finalize transfer
    const response = await paystackRequest(
      "/transfer/finalize_transfer",
      "POST",
      {
        transfer_code: wf.transferCode,
        otp,
      }
    );

    if (!response?.data?.status) {
      return res.status(400).json({
        message: "OTP verification failed",
      });
    }
  
    // 4️⃣ Mark OTP verified
    wf.status = "OTP_VERIFIED";
    wf.otpVerifiedAt = new Date();
    await wf.save();

    return res.json({
      success: true,
      message: "OTP verified successfully",
      reference,
    });

  } catch (error) {
    if (isDev) {
    console.error("VERIFY TO BANK OTP ERROR:", error);
    }

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};


export const WithdrawFundStatus = async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: "Reference is required",
      });
    }

    const wf = await ToBankTransaction.findOne({ reference });

    if (!wf) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.status(200).json({
      success: true,
      status: wf.status, // PENDING | PROCESSING | SUCCESS | FAILED
      requiresOtp: wf.status === "OTP_REQUIRED",
    });
  } catch (err) {
    if (isDev) {
    console.error("WITHDRAW FUND STATUS ERROR:", err);
    }
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transfer status",
    });
  }
};