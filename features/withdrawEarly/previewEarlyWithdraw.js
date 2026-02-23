import { calculateEarlyWithdrawalPenalty } from "../utils/calculateEarlyWithdrawalPenalty.js";
import isDev from "../utils/isDev.js";
import Plan from "../models/Plan.js";

export const previewEarlyWithdraw = async (req, res) => {
  try {
    if (isDev) {
    console.log("PREVIEW BODY:", req.body);
    }
    const { amount, planId } = req.body;

    if (!amount || amount <= 50) {
      return res.status(400).json({
        message: "Invalid amount",
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


   const penalty = calculateEarlyWithdrawalPenalty(amount);
   const totalDebit = amount + penalty;

     if (isNaN(penalty) || isNaN(totalDebit)) {
     return res.status(500).json({
       message: "Penalty calculation failed",
     });
   }
   


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