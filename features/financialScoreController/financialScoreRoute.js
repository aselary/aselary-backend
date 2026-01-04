// routes/financial.js (or wherever your route is)
import express from "express";
import mongoose, { Types, isValidObjectId } from "mongoose";
import Transaction from "../models/Transaction.js";  // adjust paths
import Repayment from "../models/Repayment.js";
import CreditLine from "../models/CreditLine.js";

const router = express.Router();

router.get("/score", async (req, res) => {
  try {
    // 1) resolve userId (auth middleware OR query param for testing)
    const userId =
      req.user?.id ||
      req.user?._id ||
      req.query.userId ||
      null;

    if (!userId) {
      return res.status(200).json({
        score: 0,
        band: "poor",
        parts: { utilization: 0, onTimeRepay: 0, savingsHabit: 0, incomeStability: 0 },
        note: "No user id; returning baseline score.",
      });
    }


// 2) Decide how to match by user depending on your schema
    // 👉 If Transaction.user is Schema.Types.ObjectId:
    //    - validate and wrap
    // 👉 If Transaction.user is String:
    //    - DO NOT wrap, just match by the string
    const userFieldIsObjectId = true; // <— set this TRUE if your schema uses ObjectId, FALSE if it uses String

    let matchUser;
    if (userFieldIsObjectId) {
      if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ message: "Invalid user id" });
      }
      matchUser = new mongoose.Types.ObjectId(String(userId)); // ✔ safe, not deprecated here
    } else {
      matchUser = String(userId); // plain string match
    }

    // 3) pull the inputs (defensive: always return a number)
    const [txAgg, repayAgg, credit] = await Promise.all([
      // Transactions aggregation
      Transaction.aggregate([
        { $match: { user: matchUser } },
        {
          $group: {
            _id: null,
            totalIn: {
              $sum: {
                $cond: [{ $in: ["$type", ["deposit", "income"]] }, "$amount", 0],
              },
            },
            totalOut: {
              $sum: {
                $cond: [{ $in: ["$type", ["withdrawal", "expense"]] }, "$amount", 0],
              },
            },
            monthsActive: { $addToSet: { $dateToString: { format: "%Y-%m", date: "$createdAt" } } },
            monthsWithSavings: {
              $sum: {
                $cond: [{ $eq: ["$type", "deposit"] }, 1, 0],
              },
            },
          },
        },
      ]),
      // Repayments aggregation
      Repayment.aggregate([
        { $match: { user: matchUser } },
        {
          $group: {
            _id: null,
            totalDue: { $sum: "$dueAmount" },
            totalPaid: { $sum: "$paidAmount" },
            onTimeCount: {
              $sum: {
                $cond: ["$paidOnTime", 1, 0],
              },
            },
            repayCount: { $sum: 1 },
          },
        },
      ]),
      // Credit line (utilization baseline)
      CreditLine.findOne({ user: matchUser }, { limit: 1 }).lean(),
    ]);

    const tx = txAgg?.[0] || {};
    const rp = repayAgg?.[0] || {};
    const limit = Math.max(0, Number(credit?.limit || 0));

    const totalIn = Math.max(0, Number(tx.totalIn || 0));
    const totalOut = Math.max(0, Number(tx.totalOut || 0));
    const savingsSum = Math.max(0, Number(tx.savingsSum || 0));
    const txCount = Math.max(0, Number(tx.txCount || 0));
    const maxIncome = Math.max(0, Number(tx.maxIncome || 0));

    const totalPaid = Math.max(0, Number(rp.totalPaid || 0));
    const totalDue = Math.max(0, Number(rp.totalDue || 0));
    const onTimeCount = Math.max(0, Number(rp.onTimeCount || 0));
    const repayCount = Math.max(0, Number(rp.repayCount || 0));

    // 3) compute sub-scores (0–100), each defensively
    // Utilization: how much of credit limit is used (lower is better)
    // If no credit line, derive “pseudo limit” from recent income (so users without loans aren’t punished).
    const pseudoLimit = limit > 0 ? limit : Math.max(totalIn * 0.5, 1); // avoid 0
    const utilizationRatio = Math.min(1, totalOut / pseudoLimit);
    const utilizationScore = Math.round((1 - utilizationRatio) * 100); // 100 = not using/low usage

    // Repayment behavior
    const repayScoreBase =
      totalDue > 0 ? Math.min(1, totalPaid / totalDue) : 1; // if nothing due, treat as perfect
    const onTimeRatio = repayCount > 0 ? onTimeCount / repayCount : 1; // if no loans, treat on-time as perfect
    const repaymentScore = Math.round(70 * repayScoreBase + 30 * onTimeRatio);

    // Savings habit: savings as share of total inflow (cap at 30% for score purposes)
    const savingsRatio = totalIn > 0 ? Math.min(1, savingsSum / (totalIn * 0.3)) : 0; // saving 30%+ counts as 100
    const savingsScore = Math.round(savingsRatio * 100);

    // Income stability: the more a single deposit dominates, the more “spiky” the income.
    const instability = totalIn > 0 ? Math.min(1, maxIncome / totalIn) : 0; // 1 = one giant spike
    const incomeStabilityScore = Math.round((1 - instability) * 100);

    // 4) weighted final score
    const score = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          0.35 * utilizationScore +
            0.35 * repaymentScore +
            0.20 * savingsScore +
            0.10 * incomeStabilityScore
        )
      )
    );

    const band = score < 40 ? "poor" : score < 70 ? "fair" : "good";

    return res.json({
      score,
      band,
      parts: {
        utilization: utilizationScore,
        onTimeRepay: repaymentScore,
        savingsHabit: savingsScore,
        incomeStability: incomeStabilityScore,
      },
    });
  } catch (err) {
    console.error("Financial score error:", err);
    return res.status(200).json({
      score: 0,
      band: "poor",
      parts: { utilization: 0, onTimeRepay: 0, savingsHabit: 0, incomeStability: 0 },
      message: "Failed to compute score (returned safe baseline).",
    });
  }
});

export default router;
