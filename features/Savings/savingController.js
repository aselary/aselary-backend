import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export async function getSavingsStreak(req, res) {
  try {
    const userId = req.user?._id || req.query.userId; // support auth or query
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(200).json({ streak: 0, best: 0, lastDeposit: null, note: "no user id" });
    }

    // Pull only deposit-like txns (you can adjust to match your types)
    const rows = await Transaction.find({
      user: userId,
      type: { $in: ["deposit", "income", "interest"] },
    })
      .select({ occurredAt: 1 })
      .sort({ occurredAt: -1 })
      .limit(365); // safety: last year

    if (!rows.length) return res.json({ streak: 0, best: 0, lastDeposit: null });

    // Collapse to unique days (ignore multiple deposits same day)
    const days = [];
    const seen = new Set();
    for (const r of rows) {
      const dayKey = startOfDay(r.occurredAt).getTime();
      if (!seen.has(dayKey)) {
        seen.add(dayKey);
        days.push(new Date(dayKey));
      }
    }
    // Compute current streak (up to today)
    let streak = 0;
    let best = 1;
    let run = 1;

    // If most recent deposit is not today or yesterday, current streak may be 0
    const today0 = startOfDay(new Date());
    const last = days[0];
    const diffDays = Math.round((today0 - startOfDay(last)) / (24 * 3600 * 1000));
    if (diffDays > 1) {
      streak = 0;
    } else {
      // Walk consecutive unique days (sorted desc)
      for (let i = 0; i < days.length - 1; i++) {
        const gap = Math.round((startOfDay(days[i]) - startOfDay(days[i + 1])) / (24 * 3600 * 1000));
        if (i === 0) {
          // first step includes today/yesterday already
          run = 1 + (diffDays === 0 ? 0 : 0); // run starts at 1 for last day
        }
        if (gap === 1) {
          run += 1;
          best = Math.max(best, run);
        } else {
          best = Math.max(best, run);
          run = 1;
        }
      }
      streak = run;
    }

    // Best streak over the array
    // (If streak ended earlier, the loop above already tracked best)
    // Ensure >= streak
    best = Math.max(best, streak);

    return res.json({
      streak,
      best,
      lastDeposit: days[0],
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to compute streak" });
  }
}