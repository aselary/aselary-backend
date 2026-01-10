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