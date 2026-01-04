import Deposit from "../models/deposit.js"; // adjust path if needed
import isDev from "../../../features/utils/isDev.js";

// GET /api/deposits
export const getAllDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find().sort({ createdAt: -1 });
    res.status(200).json(deposits);
  } catch (err) {
    if (isDev) {
    console.error("Error fetching deposits:", err);
    }
    res.status(500).json({ error: "Failed to fetch deposits" });
  }
};
