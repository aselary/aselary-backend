// controllers/txController.js
import Transaction from "../models/Transaction.js";

export const txController = {
  // /api/tx/mine?page=1&limit=50
  async mine(req, res) {
    try {
      const userId = req.userId;                       // set by your auth middleware
      const page  = Math.max(parseInt(req.query.page || "1", 10), 1);
      const limit = Math.min(parseInt(req.query.limit || "50", 10), 100);
      const skip  = (page - 1) * limit;

      const [items, total] = await Promise.all([
        Transaction.find({ userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Transaction.countDocuments({ userId }),
      ]);

      res.json({ ok: true, page, limit, total, items });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // /api/admin/tx/all?page=1&limit=100  (admin only)
  async all(_req, res) {
    try {
      const page  = Math.max(parseInt(res.req.query.page || "1", 10), 1);
      const limit = Math.min(parseInt(res.req.query.limit || "100", 10), 200);
      const skip  = (page - 1) * limit;

      const [items, total] = await Promise.all([
        Transaction.find({})
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Transaction.countDocuments({}),
      ]);

      res.json({ ok: true, page, limit, total, items });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};