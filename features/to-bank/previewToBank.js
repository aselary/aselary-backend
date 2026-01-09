import { calculateFee } from "../utils/calculateFee.js";
import { TO_BANK_FEES } from "../../config/fee.js";
import isDev from "../utils/isDev.js";

export const previewToBankTransfer = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 90) {
      return res.status(400).json({
        message: "Invalid amount"
      });
    }

    const fee = calculateFee(amount, TO_BANK_FEES);
    const totalDebit = amount + fee;

    return res.status(200).json({
      amount,
      fee,
      totalDebit,
      breakdown: {
        transferAmount: amount,
        serviceFee: fee
      }
    });
  } catch (error) {
    if (isDev) {
    console.error(error);
    }
    return res.status(500).json({
      message: "Failed to preview transfer"
    });
  }
};