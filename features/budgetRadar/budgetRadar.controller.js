// GET /api/budget/radar
import Budget from '../models/Budget.js';
import Transaction from "../models/Transaction.js"
export async function getBudgetRadar(req, res) {
  try {
    const userId = req.user._id;
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth(); // 0..11
    const monthStart = new Date(Date.UTC(y, m, 1));
    const monthEnd   = new Date(Date.UTC(y, m + 1, 1));

    const cats = ["Housing","Food","Transport","Health","Entertainment","Savings"];
    const angleByCat = (cat) => (cats.indexOf(cat) * (360 / cats.length));

    // load budgets for this month (fallback 0)
    const budgets = await Budget.find({ userId, month: `${y}-${String(m+1).padStart(2,'0')}` })
      .lean();
    const budgetMap = Object.fromEntries(cats.map(c => [c, 0]));
    budgets.forEach(b => { if (budgetMap[b.category] !== undefined) budgetMap[b.category] = b.target || 0; });

    // sum transactions in month
    const txs = await Transaction.find({
      userId,
      date: { $gte: monthStart, $lt: monthEnd }
    }).lean();

    const spent = Object.fromEntries(cats.map(c => [c, 0]));
    txs.forEach(t => {
      if (!spent[t.category]) spent[t.category] = 0;
      // if you store savings as type:'saving', treat as positive progress for Savings
      if (t.category === "Savings" || t.type === "saving") spent["Savings"] += Math.max(0, t.amount);
      else spent[t.category] += Math.max(0, t.amount);
    });

    // convert to percentage vs target; clamp 0..100+
    const points = cats.map((cat, i) => {
      const target = Math.max(1, budgetMap[cat]); // avoid /0; if truly no target, keep 0 below
      const raw = target === 0 ? 0 : Math.round((spent[cat] / target) * 100);
      const value = Math.max(0, Math.min(raw, 100)); // keep 0..100 for the radar radius
      const status = value > 75 ? "overspending" : value > 55 ? "balanced" : "safe";
      return { label: cat, value, angle: angleByCat(cat), status };
    });

    res.json({ rings: [20,40,60,80,100], points });
  } catch (err) {
    console.error("Radar error:", err);
    res.status(500).json({ error: "server_error" });
  }
}

