import Wallet from "../models/Wallet.js";
import User from "../models/User.js";

export const getSmartBalance = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const user = await User.findById(userId).select("fullName");

    return res.status(200).json({
      success: true,
      message: "Balance loaded",
      balance: {
        available: wallet.balance,
        currency: "NGN",
        owner: user?.fullName || "User",
      },
    });
  } catch (error) {
    console.error("GET SMART BALANCE ERROR:", error);
    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
};