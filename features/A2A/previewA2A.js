import { calculateFee } from "../utils/calculateFee.js";
import { A2A_FEES } from "../../config/fee.js";

export const previewA2A = async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount < 90) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  const fee = calculateFee(amount, A2A_FEES);

  res.json({
    amount,
    fee,
    totalDebit: amount + fee,
     breakdown: {
        transferAmount: amount,
        serviceFee: fee
      }
  });
};