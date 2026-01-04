import axios from "axios";
import Wallet from "../models/Wallet.js";
import isDev from "../utils/isDev.js";

export const verifyPaystackPayment = async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({ message: "Missing transaction reference" });
    }

    // VERIFY FROM PAYSTACK
    const paystackRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const result = paystackRes.data.data;

    if (result.status !== "success") {
      return res.status(400).json({ message: "Payment not successful" });
    }

    const amountPaid = result.amount / 100; // convert kobo to naira
    const userId = result.metadata.userId;

    // FIND WALLET
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // UPDATE BALANCE
    wallet.balance += amountPaid;

    // LOG TRANSACTION
    wallet.transactions.push({
      type: "deposit",
      amount: amountPaid,
      reference,
      status: "success",
    });

    await wallet.save();

    return res.json({
      success: true,
      message: "Wallet updated successfully",
      amount: amountPaid,
    });
  } catch (error) {
    if (isDev) {
    console.error("VERIFY PAYSTACK PAYMENT ERROR:", error);
    }
    return res.status(500).json({ message: "Verification failed" });
  }
};