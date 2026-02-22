import express from "express";
import { createPlan, getMyPlans } from "./planController.js";
import protect from  "../middleware/authMiddleware.js";
import Plan from "../models/Plan.js";
import isDev from "../utils/isDev.js"; 


const router = express.Router();

router.post("/create", protect, createPlan);
router.get("/my-plans", protect, getMyPlans);
router.delete("/:id", protect, async (req, res) => {
  if (isDev) {
  console.log("🔥 ARCHIVE ROUTE HIT");
  }
  try {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // make sure owner is deleting
    if (plan.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // 🔒 BLOCK if funded
   // 🔒 BLOCK if plan has money
if (plan.balance !== 0) {
  return res.status(400).json({
    error: "Plan with funds cannot be archived"
  });
}


// ✅ ARCHIVE INSTEAD OF DELETE
  plan.status = "archived";
  plan.archivedAt = new Date();
  await plan.save();

res.json({ success: true });

  } catch (err) {
    if (isDev) {
    console.error("DELETE ERROR:", err);
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;