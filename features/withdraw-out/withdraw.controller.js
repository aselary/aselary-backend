import Wallet from "../models/Wallet.js";
import Ledger from "../models/Ledger.js";
import ActivityLog from "../models/ActivityLog.js";
import paystack from "../utils/paystack.js"; // your axios wrapper
import isDev from "../utils/isDev.js";
import { getPaystackBalance } from "../utils/paystackBalance.js";
import { LIMITS } from "../../config/limits.js"; 


export const withdrawToBank = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, bankCode, accountNumber, accountName } = req.body;

    // 1️⃣ Basic validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }


    if (amount > LIMITS.TO_BANK.maxPerTransaction) {
      return res.status(400).json({
      message: `Withdrawal limit is ₦${LIMITS.TO_BANK.maxPerTransaction}`,
             });
    }

    // 2️⃣ Get wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // 3️⃣ Balance check
    // 1️⃣ Check user wallet first (you already do this)
    if (wallet.balance < amount) {
      return res.status(400).json({
      message: "Insufficient wallet balance",
             });
    }

     // 2️⃣ Check PAYSTACK BALANCE
   const paystackBalance = await getPaystackBalance();

    if (paystackBalance < amount) {
      return res.status(400).json({
      message: "Withdrawals temporarily unavailable. Please try again later.",
      });
    }

    // 4️⃣ Debit wallet IMMEDIATELY
    const balanceBefore = wallet.balance;
    wallet.balance -= amount;
    await wallet.save();

    const balanceAfter = wallet.balance;

    // 5️⃣ Create PENDING ledger
    const ledger = await Ledger.create({
      userId,
      walletId: wallet._id,

      type: "DEBIT",
      source: "withdrawal",
      channel: "BANK_TRANSFER",

      amount,
      balanceBefore,
      balanceAfter,

      status: "PENDING",
      narration: "Withdrawal to bank",

      meta: {
        bankCode,
        accountNumber,
        accountName,
      },
    });

    // 6️⃣ Call Paystack transfer
    const transferResponse = await paystack.post("/transfer", {
      source: "balance",
      amount: amount * 100,
      recipient: {
        type: "nuban",
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN",
      },
      reason: "Wallet withdrawal",
      reference: ledger._id.toString(),
    });

    if (isDev) {
      console.log("PAYSTACK TRANSFER INITIATED:", transferResponse.data);
    }

    // 7️⃣ Activity log
    await ActivityLog.create({
      userId,
      actorId: userId,
      walletId: wallet._id,

      category: "TRANSFER",
      channel: "BANK_TRANSFER",
      type: "TO_BANK",
      direction: "DEBIT",

      amount,
      reference: ledger._id.toString(),
      status: "PENDING",
      narration: "Withdrawal initiated",
    });

    // 8️⃣ Respond immediately
    return res.status(200).json({
      message: "Withdrawal initiated",
      balance: wallet.balance,
      reference: ledger._id,
    });
  } catch (err) {
    console.error("WITHDRAW ERROR:", err.message);
    return res.status(500).json({ message: "Withdrawal failed" });
  }
};