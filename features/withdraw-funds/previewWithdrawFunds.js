import { calculateFee } from "../utils/calculateFee.js";
import isDev from "../utils/isDev.js";
import Plan from "../models/Plan.js";

export const previewWithdrawFunds = async (req, res) => {
  try {

    if (isDev) {
        console.log("PREVIEW BODY:", req.body);
    }
    const { amount, planId } = req.body;

    if (!amount || amount <= 99) {
      return res.status(400).json({
        message: "Invalid amount"
      });
    }

    // 🔒 get plan
    const plan = await Plan.findById(planId);

    if (!plan) {
      return res.status(404).json({
        message: "Plan not found"
      });
    }

    // 🚨 BLOCK FEE CHECK IF AMOUNT > PLAN BALANCE
    if (Number(amount) > Number(plan.balance)) {
      return res.status(400).json({
        message: "Amount exceeds your plan balance"
      });
    }

    // 💰 now calculate fee ONLY if valid
    const fee = calculateFee(amount);
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