import { EARLY_WITHDRAW_PENALTY } from "../../config/penalty.js";
import isDev from "../utils/isDev.js";

export const previewEarlyWithdraw = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 99) {
      return res.status(400).json({
        message: "Invalid amount",
      });
    }

    // ✅ EARLY WITHDRAW PENALTY LOGIC (INLINE)
    // ✅ EARLY WITHDRAW PENALTY (10% capped at ₦2,000)
let penalty = 0;

if (EARLY_WITHDRAW_PENALTY.type === "percentage") {
  penalty = Math.floor((amount * EARLY_WITHDRAW_PENALTY.value) / 100);

  // 🔒 CAP PENALTY AT ₦2,000
  if (penalty > 2000) {
    penalty = 2000;
  }
}

  const totalDebit = amount + penalty;


    return res.status(200).json({
      amount,
      penalty,
      totalDebit,
      breakdown: {
        transferAmount: amount,
        serviceFee: penalty,
      },
    });

  } catch (error) {
    if (isDev) {
      console.error(error);
    }

    return res.status(500).json({
      message: "Failed to preview early withdrawal",
    });
  }
};