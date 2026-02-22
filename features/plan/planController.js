import Plan from "../models/Plan.js";
import isDev from "../utils/isDev.js";


export const createPlan = async (req, res) => {
  try {
    const { amount, frequency, duration, startDate, narration, withdrawalAccount } = req.body;

    // ✅ Validate inputs
    if (!amount || !frequency || !duration || !startDate) {
      return res.status(400).json({
        message: "Amount, frequency, duration and start date are required",
      });
    }

    const amt = Number(amount);

   if (isNaN(amt) || amt < 100) {
    return res.status(400).json({
       message: "Minimum saving amount is ₦100"
      });
    }

        if (!withdrawalAccount || 
            !withdrawalAccount.bankName || 
            !withdrawalAccount.bankCode || 
            !withdrawalAccount.accountNumber || 
            !withdrawalAccount.accountName) {
               return res.status(400).json({
                message: "Withdrawal account is required"
       });
    }

    if (!["daily", "weekly", "monthly"].includes(frequency)) {
      return res.status(400).json({
        message: "Invalid frequency",
      });
    }

    if (Number(duration) <= 0) {
      return res.status(400).json({
        message: "Duration must be greater than zero",
      });
    }

    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return res.status(400).json({
        message: "Invalid start date",
      });
    }

    // ✅ Calculate end date based on frequency & duration
    let endDate = new Date(start);

    if (frequency === "daily") {
      endDate.setDate(endDate.getDate() + Number(duration));
    }

    if (frequency === "weekly") {
      endDate.setDate(endDate.getDate() + Number(duration) * 7);
    }

    if (frequency === "monthly") {
      endDate.setMonth(endDate.getMonth() + Number(duration));
    }
    // calculate real number of days
   const diffMs = endDate.getTime() - start.getTime();
   const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

// final total target
const totalTarget = amt * diffDays;

    // ✅ Generate human title
    const title = `₦${amount} ${frequency} savings for ${duration} ${
      frequency === "daily"
        ? "days"
        : frequency === "weekly"
        ? "weeks"
        : "months"
    }`;

    // ✅ Generate reference
    const reference = `PLN-${Date.now().toString().slice(-6)}`;


    let nextRunAt = new Date(start); // first deduction immediately

    // ✅ Create plan
    const plan = new Plan({
      userId: req.user.id,
      title,
      amount,
      frequency,
      narration,
      duration,
      startDate: start,
      endDate,
      reference,
      totalTarget,
      status: "active",

      nextRunAt,

      withdrawalAccount: {
      bankName: withdrawalAccount.bankName,
      bankCode: withdrawalAccount.bankCode,
      accountNumber: withdrawalAccount.accountNumber,
      accountName: withdrawalAccount.accountName,
      locked: false
    },
 });

    await plan.save();

    return res.status(201).json({
      message: "Plan created successfully",
      plan,
    });
  } catch (error) {
    if (isDev) {
    console.error("Create plan error:", error);
    }
    return res.status(500).json({
      message: "Server error creating plan",
    });
  }
};

export const getMyPlans = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // 🔓 Unlock matured plans
    await Plan.updateMany(
      {
        userId,
        endDate: { $lte: now },
        withdrawLocked: true,
      },
      {
        $set: {
          withdrawLocked: false,
          status: "completed",
        },
      }
    );

    // 📦 Fetch user plans
const plans = await Plan.find({
  userId,
  status: { $in: ["active", "completed", "closing", "terminated"] }
}).sort({ createdAt: -1 });

    return res.status(200).json(plans);
  } catch (error) {
    if (isDev) {
    console.error("Get plans error:", error);
    }
    return res.status(500).json({
      message: "Failed to fetch plans",
    });
  }
};

