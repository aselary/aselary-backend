import Wallet from "../models/Wallet.js";
import User from "../models/User.js";
import isDev from "../utils/isDev.js";

export const lookupWalletAccount = async (req, res) => {
  try {
    const { accountNumber } = req.params;

    if (!accountNumber || accountNumber.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Invalid account number",
      });
    }

    // Find wallet
    const wallet = await Wallet.findOne({ accountNumber });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Find owner
    const user = await User.findById(wallet.userId).select("fullName");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account owner not found",
      });
    }

    return res.status(200).json({
      success: true,
      fullName: user.fullName,
      accountNumber,
      provider: wallet.provider,
    });
  } catch (err) {
    if (isDev) {
    console.error("WALLET LOOKUP ERROR:", err);
    }
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};