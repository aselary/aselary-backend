import Record from "../models/Record.js";
import Plan from "../models/Plan.js";

export const addRecord = async (req, res) => {
  try {
    const { planId, amount } = req.body;

    if (!planId || !amount) {
      return res.status(400).json({
        message: "planId and amount are required",
      });
    }

    // 1️⃣ find plan
    const plan = await Plan.findById(planId);

    if (!plan) {
      return res.status(404).json({
        message: "Plan not found",
      });
    }

    // 2️⃣ count how many records already exist for this plan
    const recordCount = await Record.countDocuments({
      planId,
      userId: req.user.id,
    });

   // next day in plan
const planDay = recordCount + 1;

// snapshot of plan duration (important)
const planDuration = plan.duration; // or plan.totalDays

// generate unique reference
const reference = `RC-${Date.now().toString().slice(-6)}`;

// create record
const record = new Record({
  planId,
  userId: req.user.id,
  amount,
  type: "deposit",
  reference,
  planDay,
  planDuration, // ✅ now matches model
});

    await record.save();

    return res.status(201).json({
      message: "Contribution recorded successfully",
      record,
    });
  } catch (error) {
    console.error("Add record error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const getMyRecords = async (req, res) => {
  try {
    const records = await Record.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json({ records });
  } catch (err) {
    res.status(500).json({ message: "Failed to load records" });
  }
};