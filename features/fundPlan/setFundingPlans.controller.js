import User from "../models/User.js";

export const setFundingPlans = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planIds } = req.body;

    if (!planIds || !Array.isArray(planIds)) {
      return res.status(400).json({ msg: "No plans selected" });
    }

    await User.findByIdAndUpdate(userId, {
      selectedFundingPlans: planIds,
    });

    return res.json({ msg: "Funding plans updated" });

  } catch (err) {
    if (isDev) {
    console.log("Set funding plans error:", err);
    }
    res.status(500).json({ msg: "Server error" });
  }
};