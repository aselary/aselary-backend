// features/transactions/tx.controller.js
import Transaction from "../models/Transaction.js";

// helper: figure month start/end
function monthRange(param) {
  if (!param || param === "current") {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const start = new Date(Date.UTC(y, m, 1));
    const end   = new Date(Date.UTC(y, m + 1, 1));
    return { start, end };
  }
  // support "YYYY-MM"
  const [yStr, mStr] = String(param).split("-");
  const y = Number(yStr), m = Number(mStr) - 1;
  const start = new Date(Date.UTC(y, m, 1));
  const end   = new Date(Date.UTC(y, m + 1, 1));
  return { start, end };
}

// GET /api/tx/recent?limit=5
export async function getRecentTx(req, res) {
  try {
    const userId = req.user._id;               // adjust if you use req.user.id
    const limit = Math.min(50, Number(req.query.limit || 5));

    const items = await Transaction.find({ user: userId }) // or { userId: userId }
      .sort({ date: -1, _id: -1 })
      .limit(limit)
      .select({ desc: 1, category: 1, amount: 1, type: 1, date: 1 })
      .lean();

    res.json({ items });
  } catch (err) {
    console.error("getRecentTx error:", err);
    res.status(500).json({ error: "server_error" });
  }
}

// GET /api/tx/breakdown?month=current
// sums spending per category for the month
export async function getBreakdown(req, res) {
  try {
    const userId = req.user._id;               // adjust if needed
    const { start, end } = monthRange(req.query.month);

    // Define which transaction types count as “spend”.
    // If you store negative amounts for spend, remove the $cond below and use $abs: "$amount".
    const spendTypes = ["debit"]; // treat "saving" separately if you like

    const pipeline = [
      { $match: {
          user: userId,                       // or userId: userId
          date: { $gte: start, $lt: end },
          type: { $in: spendTypes }
        }
      },
      {
        $group: {
          _id: "$category",
          amount: { $sum: "$amount" }        // amount should already be positive
        }
      },
      { $project: { _id: 0, category: "$_id", amount: 1 } },
      { $sort: { category: 1 } }
    ];

    const items = await Transaction.aggregate(pipeline);

    res.json({ items });
  } catch (err) {
    console.error("getBreakdown error:", err);
    res.status(500).json({ error: "server_error" });
  }
}
