// routes/admin/dashboard.js
import express from 'express';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Logic from '../models/Logic.js';
import { getRecentActivities } from '../dashboard/activityLog.js';

const router = express.Router();
router.get('/recent-activities', getRecentActivities);
router.get('/admin-stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRevenue = await Transaction.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const activeLogic = await Logic.countDocuments();

    res.json({
      totalUsers,
      totalRevenue: totalRevenue[0]?.total || 0,
      activeLogic
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
