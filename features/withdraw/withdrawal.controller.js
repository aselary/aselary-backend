import Wallet from "../models/Wallet.js";
import Withdrawal from "../models/Withdrawal.js";
import paystack from "../utils/paystack.js";
import crypto from "crypto";

export const cashOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, bankCode, accountNumber } = req.body;

    // 1️⃣ Basic validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (!bankCode || !accountNumber) {
      return res.status(400).json({ message: "Bank details required" });
    }

    // 2️⃣ Get wallet
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // 3️⃣ Balance check
    if (wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // 4️⃣ Generate reference
    const reference = `WD_${crypto.randomBytes(8).toString("hex")}`;

    // 5️⃣ Create withdrawal record (PENDING)
    const withdrawal = await Withdrawal.create({
      user: userId,
      amount,
      bankCode,
      accountNumber,
      reference,
    });

    // 6️⃣ Create Paystack transfer recipient (TEST)
    const recipientRes = await paystack.post("/transferrecipient", {
      type: "nuban",
      name: "User Cash Out",
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
    });

    const recipientCode = recipientRes.data.data.recipient_code;

    withdrawal.recipientCode = recipientCode;
    await withdrawal.save();

    // 7️⃣ Initiate transfer (TEST)
    const transferRes = await paystack.post("/transfer", {
      source: "balance",
      amount: amount * 100, // kobo
      recipient: recipientCode,
      reference,
      reason: "User cash out",
    });

    // 8️⃣ Update wallet & withdrawal status
    wallet.balance -= amount;
    await wallet.save();

    withdrawal.status = "SUCCESS";
    await withdrawal.save();

    return res.status(200).json({
      message: "Cash out successful",
      withdrawal: {
        reference,
        amount,
        status: withdrawal.status,
      },
    });
  } catch (error) {
    console.error("Cash out error:", error.response?.data || error.message);

    return res.status(500).json({
      message: "Unable to process cash out at the moment",
    });
  }
};