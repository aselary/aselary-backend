import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import Ledger from "../models/Ledger.js";
import ActivityLog from "../models/ActivityLog.js";
import { generateInternalRef } from "../utils/generateInternalRef.js";
import Method from "../models/Method.js";

// 🔐 VERSION 1.0 LIMITS
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 9999;

// -----------------------------
// 1️⃣ INIT CARD DEPOSIT
// -----------------------------

export const initCardDeposit = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }
         
    // Amount limits
    if (amount < MIN_AMOUNT) {
      return res.status(400).json({
        success: false,
        message: `Minimum card deposit is ₦${MIN_AMOUNT}`,
      });
    }

    if (amount > MAX_AMOUNT) {
      return res.status(400).json({
        success: false,
        message: `Maximum card deposit is ₦${MAX_AMOUNT}`,
      });
    }

    // Find user wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

        const internalRef = generateInternalRef("CARD");


    // Fetch User email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
     

    const pendingTx = await Transaction.findOne({
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
      amount: amount * 100,
      metadata: {
        userId: userId.toString(),
        internalRef,
      },
    }),
  }
);

const data = await response.json();

if (!data.status) {
  throw new Error(data.message || "Paystack init failed");
}

    const { authorization_url, reference } = data.data;
            const providerRef = reference;


  const existingTx = await Method.findOne({ internalRef });

if (!existingTx) {
  await Method.create({
    userId,
    internalRef,
    providerRef,
      type: "deposit",
      method: "card",
    amount,
    status: "pending",
  });
}

    return res.json({
      success: true,
      message: "Paystack transaction created",
      data: {
        authorizationUrl: authorization_url,
        internalRef,
      },
    });
  } catch (err) {
    console.log("Card Init Error:", err.response?.data || err);
    return res.status(500).json({
      success: false,
      message: "Unable to initialize card deposit",
    });
  }
};


// -----------------------------
// 2️⃣ VERIFY CARD DEPOSIT
// -----------------------------
export const verifyCardDeposit = async (req, res) => {
  const { reference: providerRef, internalRef } = req.query;

  if (!providerRef || !internalRef) {
    return res.status(400).json({
      success: false,
      message: "Missing reference or internalRef",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    /* ----------------------------------------
       1. VERIFY WITH PAYSTACK (BY PROVIDER REF)
    ----------------------------------------- */
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${providerRef}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (!data.status || data.data.status !== "success") {
      throw new Error("Payment verification failed");
    }

    /* ----------------------------------------
       2. FIND TRANSACTION (BY INTERNAL REF)
    ----------------------------------------- */
    const tx = await Method.findOne({ internalRef }).session(session);

    if (!tx) {
      throw new Error("Transaction not found");
    }

    /* ----------------------------------------
       3. PREVENT DOUBLE CREDIT
    ----------------------------------------- */
    if (tx.status === "success") {
      await session.commitTransaction();
      session.endSession();

      return res.json({
        success: true,
        message: "Transaction already verified",
        balance: null,
      });
    }

    /* ----------------------------------------
       4. UPDATE TRANSACTION
    ----------------------------------------- */
    tx.status = "success";
    tx.providerRef = providerRef;
    await tx.save({ session });

    /* ----------------------------------------
       5. FETCH WALLET
    ----------------------------------------- */
    const wallet = await Wallet.findOne({ userId: tx.userId }).session(session);
    if (!wallet) throw new Error("Wallet not found");

    const balanceBefore = wallet.balance;

    /* ----------------------------------------
       6. CREDIT WALLET
    ----------------------------------------- */
    wallet.balance += tx.amount;
    await wallet.save({ session });

    /* ----------------------------------------
       7. LEDGER ENTRY
    ----------------------------------------- */
    await Ledger.create(
      [
        {
          userId: wallet.userId,
          walletId: wallet._id,

          internalNuban: wallet.internalNuban,
          aliasAccount: wallet.accountNumber,

          type: "CREDIT",
          source: "CARD",

          amount: tx.amount,
          internalRef,
          providerRef,

          balanceBefore,
          balanceAfter: wallet.balance,

          status: "SUCCESS",
        },
      ],
      { session }
    );

    /* ----------------------------------------
       8. ACTIVITY LOG
    ----------------------------------------- */
    await ActivityLog.create(
      [
        {
          userId: wallet.userId,
          actorId: wallet.userId,
          walletId: wallet._id,

          category: "DEPOSIT",
          channel: "CARD",
          type: "DEPOSIT",

          title: "Card Deposit",
          description: `Deposited ₦${tx.amount.toLocaleString()} via Card`,

          amount: tx.amount,
          internalRef,
          providerRef,

          status: "SUCCESS",

          direction: "CREDIT",
          counterpartyName: "Card / Paystack",

          meta: {
            method: "CARD",
            provider: "PAYSTACK",
          },
        },
      ],
      { session }
    );

      await Transaction.create(
      [
        {
          userId: wallet.userId,
          actorId: wallet.userId,
          walletId: wallet._id,

          category: "DEPOSIT",
          channel: "CARD",
          type: "DEPOSIT",

          title: "Card Deposit",
          description: `Deposited ₦${tx.amount.toLocaleString()} via Card`,

          amount: tx.amount,
          internalRef,
          providerRef,

          status: "SUCCESS",

          direction: "CREDIT",
          counterpartyName: "Card / Paystack",

          meta: {
            method: "CARD",
            provider: "PAYSTACK",
          },
        },
      ],
      { session }
    );
        
    /* ----------------------------------------
       9. COMMIT
    ----------------------------------------- */
    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      message: "Deposit successful",
      balance: wallet.balance,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("Verify card deposit error:", err);

    return res.status(500).json({
      success: false,
      message: "Deposit verification failed",
    });
  }
};