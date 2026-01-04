import Total from "../models/Total.js";
import Withdraw from "../models/Withdraw.js";

export const getPlatformGain = async (req, res) => {
  try {
    // 1. Total deposits = number of users * assumed # of deposits
    const depositCount = await Total.countDocuments();
    const depositEarning = depositCount * 2; // ₦2 fee per deposit

    // 2. Withdrawal fee earnings (₦20 per withdrawal marked "paid")
    const withdrawalCount = await Withdraw.countDocuments({ status: "paid" });
    const withdrawalEarning = withdrawalCount * 20;

    // Total gain
    const gain = depositEarning + withdrawalEarning;

    res.status(200).json({ gain });
  } catch (error) {
    console.error("Error calculating platform gain:", error);
    res.status(500).json({ error: "Failed to fetch gain" });
  }
};
