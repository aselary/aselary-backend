import mongoose from "mongoose";
import Ledger from "../models/Ledger.js";
import User from "../models/User.js";
import ToBankTransaction from "../models/ToBankTransaction.js";
import ActivityLog from "../models/ActivityLog.js";
import Transaction from "../models/Transaction.js";
import addPlatformFee from "../utils/addPlatformFee.js";
import PlatformLedger from "../models/PlatformLedger.js";
import Wallet from "../models/Wallet.js";
import { LIMITS } from "../../config/limits.js";
import Plan from "../models/Plan.js";
import { getDailyTransferTotal } from "../utils/getDailyTransferTotal.js";
import { createTransferRecipient } from "../transfer/createRecipient.js";
import { initiatePaystackTransfer } from "../transfer/initiateTransfer.js";
import isDev from "../utils/isDev.js";
import { calculateEarlyWithdrawalPenalty } from "../utils/calculateEarlyWithdrawalPenalty.js";
import TransferOTP from "../models/transferOtpModel.js";
import { sendEmail } from "../../config/mailer.js";

export const earlyWithdraw = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    const userId = req.user.id;
    const {
      amount,
      narration,
      planId,
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
    // 1️⃣ Validate input
    if (
      !amount
    ) {
      return res.status(400).json({ message: "All fields are required" });
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



    if (plan.status === "terminated") {
   await session.abortTransaction();
   session.endSession();
   return res.status(400).json({
      message: "This plan is no longer active"
   });
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
   const reference = `EW-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
   if (isDev) {
   console.log("🔖 STEP 2: REFERENCE =", reference);
console.log("🔍 STEP 3: Checking pending transaction...");
   }

 const penalty = calculateEarlyWithdrawalPenalty(amount);
const totalDebit = amount + penalty;
    if (isDev) {
     console.log("💸 STEP 4: penalty & totalDebit", { penalty, totalDebit });
    }

// 1️⃣ Per-transaction limit
if (amount > LIMITS.TO_BANK.maxPerTransaction) {
  return res.status(400).json({
    message: `Early withdraw limit is ₦${LIMITS.TO_BANK.maxPerTransaction.toLocaleString()} per transaction`,
  });
}
   const dailyTotal = await getDailyTransferTotal({
  userId,
  type: "EARLY_WITHDRAW",
});

if (dailyTotal + amount > LIMITS.TO_BANK.maxDailyTotal) {
  return res.status(403).json({
    message: `Daily early withdraw limit is ₦${LIMITS.TO_BANK.maxDailyTotal.toLocaleString()}`,
  });
}

const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);

const sameBankCount = await Transaction.countDocuments({
  userId,
  type: "EARLY_WITHDRAW",
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
    type: "EARLY_WITHDRAW",
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


 if (isDev) {
console.log("DEBUG userId:", userId);
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

    // 🔐 Generate OUR own OTP for user
const otp = Math.floor(100000 + Math.random() * 900000).toString();
if (isDev) {
console.log("✅ OTP GENERATED:", otp);
}
const expiresAt = new Date(Date.now() + 10 * 60 * 1000);


   await ToBankTransaction.create(
  [{
    userId,
    planId: plan._id,
    walletId: wallet._id,
    amount,
    penalty,
    totalDebit,
    bankName,
    bankCode,
    accountNumber,
    accountName,
    reference,
    status: "OTP_REQUIRED",
  }],
  { session }
);


// Save OTP
await TransferOTP.create({
  userId,
  reference,
  otp,
  expiresAt,
  used: false
});
  
    if (isDev) {
  console.log("✅ OTP SAVED TO DB");
    }

 const user = await User.findById(userId).select("email");
if (!user) throw new Error("User not found");

const email = user.email;

if (isDev) {
console.log("📩 ABOUT TO SEND EMAIL TO:", email);
}



// Send OTP to user email
try {
  const info = await sendEmail({
  to: email,
  subject: "Confirm your withdrawal",
 html: `
<div style="margin:0;padding:0;background:#0b0f1a;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.05);">

    <!-- HEADER -->
    <div style="background:linear-gradient(135deg,#0ea5e9,#6366f1);padding:25px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:1px;">
        🔐 Secure Withdrawal Confirmation
      </h1>
      <p style="color:#e0e7ff;margin-top:6px;font-size:13px;">
        Verify your transaction
      </p>
    </div>

    <!-- BODY -->
    <div style="padding:30px;color:#e5e7eb;text-align:center;">

      <p style="font-size:15px;margin-bottom:20px;">
        Use the secure OTP below to confirm your withdrawal.
      </p>

      <!-- OTP BOX -->
      <div style="
        font-size:38px;
        letter-spacing:8px;
        font-weight:bold;
        color:#0ea5e9;
        background:#020617;
        padding:18px 25px;
        border-radius:12px;
        display:inline-block;
        border:1px solid rgba(14,165,233,0.4);
        box-shadow:0 0 20px rgba(14,165,233,0.2);
        margin-bottom:20px;
      ">
        ${otp}
      </div>

      <p style="font-size:13px;color:#9ca3af;margin-top:10px;">
        This OTP expires in <b>10 minutes</b>.
      </p>

      <div style="margin-top:25px;padding:15px;background:#020617;border-radius:10px;border:1px solid rgba(255,255,255,0.05);">
        <p style="font-size:12px;color:#9ca3af;margin:0;">
          ⚠️ Never share this code with anyone.<br/>
          Our team will never ask for your OTP.
        </p>
      </div>

    </div>

    <!-- FOOTER -->
    <div style="padding:18px;text-align:center;background:#020617;color:#6b7280;font-size:11px;">
      © ${new Date().getFullYear()} Aselary Secure System  
      <br/>Protected Financial Environment
    </div>

  </div>
</div>
`
});

if (isDev) {
 console.log("📬 EMAIL SENT RESULT:", info);
}
} catch (mailErr) {
  if (isDev) {
  console.log("❌ EMAIL FAILED:", mailErr.message);
  }s
}

if (isDev) {
console.log("🔥 RECIPIENT PAYLOAD", {
  accountName,
  accountNumber,
  bankCode,
});
}

  if (isDev) {
console.log("📒 STEP 6: Creating ActivityLog...");
  }
  await ActivityLog.create(
  [
    {
      userId,
      planId: plan._id,
      actorId: userId, // ✅ FIX
      walletId: wallet._id,

      category: "PLAN",
      channel: "EARLY_WITHDRAW",
      type: "EARLY_WITHDRAW",

      title: "Early Withdrawal",
      description: `Early withdrawal of ₦${amount} with penalty`,

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
      planId: plan._id,
      actorId: userId,
      walletId: wallet._id,

      type: "EARLY_WITHDRAW",
      category: "PLAN",
      channel: "EARLY_WITHDRAW",

      direction: "DEBIT",

      amount,
      penalty,
      netAmount: amount - penalty,

      status: "PENDING",
      reference,

      title: "Transfer to Bank",
      description: `Early withdrawal of ₦${amount} with penalty`,

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


  await ActivityLog.findOneAndUpdate(
    { reference },
    { status: "PENDING" },
    { session }
  );


  await session.commitTransaction();
  session.endSession();

  console.log("🛑 STOPPING BEFORE PAYSTACK. WAITING FOR OTP VERIFY");
  // ⛔ ABSOLUTE STOP
  return res.status(200).json({
    success: true,
    message: "Please check your email for the OTP to complete", 
    requiresOtp: true,
    data: {
      reference,
      requiresOtp: true,
    },
  });

   } catch (error) {

   if (isDev) {
     console.error("🔥 TO BANK CRASHED");
  console.error("❌ MESSAGE:", error?.message);
  console.error("❌ STACK:", error?.stack);
   }
   
  
  // 1️⃣ Abort transaction safely
  await session.abortTransaction();
  session.endSession();

  if (isDev) {
  console.error("EARLY WITHDRAW ERROR:", error);
  }


  // 3️⃣ Respond to client
  return res.status(500).json({
    message: "Internal server error",
  });
}
};




export const completeEarlyWithdraw = async (req, res) => {
  const { reference } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();
    if (isDev) {
  console.log("[COMPLETE_EARLY_WITHDRAW] START", { reference });
    }
  try {
    
    const ew = await ToBankTransaction.findOne({ reference }).session(session);
    if (isDev) {
    console.log("[COMPLETE_EARLY_WITHDRAW] EW FOUND", {
  id: ew?._id,
  status: ew?.status,
  amount: ew?.amount,
  penalty: ew?.penalty,
  walletId: ew?.walletId,
});
}
   const wallet = await Wallet.findById(ew.walletId)
   .select("balance internalNuban accountNumber")
   .session(session);
        
   if (!wallet) {
    throw new Error("Wallet not found");
    }

    if (!ew) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Transaction not found" });
    }

     if (ew.status !== "OTP_VERIFIED") {
  await session.abortTransaction();
  session.endSession();
  return res.status(400).json({
    message: "OTP not verified",
  });
}
     if (isDev) {
    console.log("[COMPLETE_EARLY_WITHDRAW] STATUS CHECK PASSED", ew.status);
     }
   if (!["OTP_VERIFIED", "PENDING"].includes(ew.status)) {
  await session.abortTransaction();
  session.endSession();
  return res.status(400).json({
    message: "Transaction already resolved"
  });
}


    const plan = await Plan.findById(ew.planId).session(session);

    if (!plan) {
       throw new Error("Plan not found");
      }
   if (isDev) {
    console.log("[COMPLETE_EARLY_WITHDRAW] WALLET FOUND", {
  planId: plan?._id,
  balance: plan?.balance,
});
   }

    
    const balanceBefore = plan.balance;
    const penalty = ew.penalty || 0;
    const totalDebit = ew.amount + penalty;

    if (plan.balance < totalDebit) {
      throw new Error("Insufficient balance");
    }

    const recipientCode = await createTransferRecipient({
  name: ew.accountName,
  accountNumber: ew.accountNumber,
  bankCode: ew.bankCode,
});

if (!recipientCode) {
  throw new Error("Recipient creation failed");
}

const paystack = await initiatePaystackTransfer({
  amount: ew.amount,
  recipientCode,
  reference,
  reason: ew.narration,
});

if (!paystack || paystack.status !== "success") {
  throw new Error("Transfer failed from Paystack");
}


    
    plan.balance -= totalDebit;
    if (isDev) {
    console.log("[COMPLETE_EARLY_WITHDRAW] DEBIT CALC", {
     balanceBefore,
     amount: ew.amount,
     penalty,
     totalDebit,
    });
     }
    await plan.save({ session });

   if (plan.balance <= 0) {
  // only terminate if empty
  plan.status = "terminated"
  plan.withdrawLocked = false
  plan.nextRunAt = null
  plan.terminatedAt = new Date()
} else {
  // still money left
  plan.status = "active"
  plan.withdrawLocked = false // allow user withdraw remaining anytime
}
    await plan.save({ session });

    if (isDev) {
    console.log("[COMPLETE_EARLY_WITHDRAW] WALLET DEBITED", {
  balanceAfter: plan.balance,
});
    }

    const balanceAfter = plan.balance;

   await Ledger.create(
  [
    {
      userId: ew.userId,
      walletId: wallet._id,
      planId: plan._id,
      type: "DEBIT",
      source: "PLAN_EARLY_WITHDRAW",
      amount: ew.totalDebit,
      balanceBefore,
      balanceAfter,
      narration: ew.narration,
      reference,
    }
  ],
  { session }
);


     await addPlatformFee(
           {
             source: "EARLY_WITHDRAW",
             amount: penalty,
             reference,
             userId: ew.userId,
             narration: "Early withdrawal penalty",
             direction: "CREDIT",
             createdAt: new Date(),
           },
           session
         );

      await PlatformLedger.create(
     [
       {
         reference,
         source: "EARLY_WITHDRAW",
         type: "PENALTY",
         direction: "CREDIT",
         amount: penalty,
         narration: "Early withdrawal penalty",
         meta: {
           userId: ew.userId,
         },
       },
     ],
     { session }
   );


    ew.status = "SUCCESS";
    if (isDev) {
    console.log("[COMPLETE_EARLY_WITHDRAW] SETTING EW SUCCESS");
    }
    ew.completedAt = new Date();
    await ew.save({ session });


    await ActivityLog.findOneAndUpdate(
      { reference },
      { status: "SUCCESS", completedAt: new Date() },
      { session }
    );

 
    await Transaction.findOneAndUpdate(
      { reference, status: "PENDING", type: "EARLY_WITHDRAW" },
      { status: "SUCCESS", completedAt: new Date() },
      { session }
    );

    await session.commitTransaction();
    if (isDev) {
    console.log("[COMPLETE_EARLY_WITHDRAW] COMMITTING TRANSACTION");
          }
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
    console.error("COMPLETE EARLY_WITHDRAW ERROR:", error);
     }
     

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};






export const failEarlyWithdraw = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reference, reason = "Bank transfer failed" } = req.body;

    const ew = await ToBankTransaction
      .findOne({ reference })
      .session(session);

    if (!ew) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (ew.status !== "PENDING") {
      return res.status(400).json({
        message: "Transaction already resolved",
      });
    }
     
    const plan = await Plan.findById(ew.planId).session(session);

    if (!plan) {
     throw new Error("Plan not found");
     }

   // unlock plan because transfer failed
    plan.withdrawLocked = false;
    await plan.save({ session });

    // Mark failed
    ew.status = "FAILED";
    ew.failedAt = new Date();
    ew.failureReason = reason;
    await ew.save({ session });

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


export const verifyEarlyWithdrawOtp = async (req, res) => {

  const { reference, otp } = req.body;

  console.log("📩 VERIFY OTP REQUEST:", { reference, otp });

  if (!reference || !otp) {
    return res.status(400).json({
      message: "Reference and OTP are required",
    });
  }

  try {
    // 1️⃣ Find transaction
    const ew = await ToBankTransaction.findOne({ reference });
     
    if (isDev) {
    console.log("💳 TRANSACTION FOUND:", ew?.status);
    }

    if (!ew) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    // 2️⃣ Guard: must be waiting for OTP
    if (ew.status !== "OTP_REQUIRED") {
      return res.status(400).json({
        message: "Transaction not awaiting OTP",
      });
    }


    
   const otpRecord = await TransferOTP.findOne({
 reference,
 otp,
 used: false,
 expiresAt: { $gt: new Date() }
});

if (!otpRecord) {
 return res.status(400).json({
   message: "Invalid or expired OTP"
 });
}

otpRecord.used = true;
await otpRecord.save();
    // 4️⃣ Mark OTP verified
    ew.status = "OTP_VERIFIED";
    ew.otpVerifiedAt = new Date();
    await ew.save();


     if (isDev) {
    console.log("🔐 OTP RECORD FOUND:", otpRecord);
     }

    return res.json({
      success: true,
      message: "OTP verified. Processing withdrawal...",
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


export const earlyWithdrawStatus = async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: "Reference is required",
      });
    }

    const ew = await ToBankTransaction.findOne({ reference });

    if (!ew ) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.status(200).json({
      success: true,
      status: ew.status, // PENDING | PROCESSING | SUCCESS | FAILED
      requiresOtp: ew.status === "OTP_REQUIRED",
    });
  } catch (err) {
    if (isDev) {
    console.error("EARLY WITHDRAW STATUS ERROR:", err);
    }
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transfer status",
    });
  }
};