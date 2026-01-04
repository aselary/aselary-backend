import Wallet from "../models/Wallet.js";
import { generateAliasAccountNumber } from "../utils/generateAliasAccountNumber.js";
import User from "../models/User.js";
import { generateInternalNuban } from "../utils/generateInternalNuban.js";
import isDev from "../utils/isDev.js";

export async function getAccountInfo(req, res) {
  try {
    const wallet = await Wallet.findOne({ userId: req.user.id });

    if (!wallet) {
      return res.json({
        success: false,
        message: "Wallet not found.",
      });
    }

    return res.json({
      success: true,
      accountNumber: wallet.accountNumber,
      bankName: wallet.bankName,
      provider: wallet.provider,
      balance: wallet.balance,
    });
  } catch (err) {
    if (isDev) {
    console.log(err);
    }
    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
}


export async function getBankTransferInfo(req, res) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ❌ NO PAYSTACK DVA → DO NOT FALL BACK
    if (!user.paystackDVA) {
      return res.json({
        success: true,
        hasRealBank: false,
      });
    }

    // ✅ PAYSTACK REAL BANK
    return res.json({
      success: true,
      hasRealBank: true,
      paystackDVA: {
        accountNumber: user.paystackDVA.accountNumber,
        bankName: user.paystackDVA.bankName,
        accountName: user.paystackDVA.accountName,
        provider: "paystack",
      },
    });
  } catch (error) {
    if (isDev) {
    console.error("BANK TRANSFER INFO ERROR:", error);
    }
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

export async function ensureAccountNumber(req, res) {
  try {
    let wallet = await Wallet.findOne({ userId: req.user.id });

    /**
     * 1️⃣ Create wallet if it does not exist
     */
    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.user.id,
        balance: 0,
        accountNumber: generateAliasAccountNumber(req.user.phone),
        internalNuban: generateInternalNuban(),
      });

      return res.json({
        success: true,
        accountNumber: wallet.accountNumber,
      });
    }

    /**
     * 2️⃣ Backfill missing fields for existing wallets
     */
    let updated = false;

    if (!wallet.accountNumber) {
      wallet.accountNumber = generateAliasAccountNumber(req.user.phone);
      updated = true;
    }

    if (!wallet.internalNuban) {
      wallet.internalNuban = generateInternalNuban();
      updated = true;
    }

    if (updated) {
      await wallet.save();
    }

    /**
     * 3️⃣ Return alias account number
     */
    return res.json({
      success: true,
      accountNumber: wallet.accountNumber,
    });

  } catch (err) {
    if (isDev) {
    console.error("ensureAccountNumber error:", err);
    }
    return res.status(500).json({
      success: false,
      message: "Error generating account number",
    });
  }
}

// ---------------------------
// GET VIRTUAL ACCOUNT INFO
// ---------------------------
export const getVirtualAccount = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user.id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }
  const user = await User.findById(req.user.id).select("fullName");
  
    // The transfer tab will show this info
    return res.json({
      success: true,
      bankName: wallet.bankName || "ASENIX VIRTUAL BANK",
      accountName: user?.fullName || "ASENIX USER",
      accountNumber: wallet.accountNumber,
      provider: wallet.provider || "ASENIX",
    });

  } catch (err) {
    if (isDev) {
    console.log("TRANSFER TAB ERROR:", err);
    }
    return res.status(500).json({
      success: false,
      message: "Server error loading bank transfer details",
    });
  }
};
