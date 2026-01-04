import ActivityLog from "../models/ActivityLog.js";

export const createActivity = async (req, res) => {
  try {
       const {
      userId,
      walletId,

      category,
      channel,
      type,

      title,
      description,
      amount,
      reference,

      // optional extras
      counterpartyId,
      counterpartyName,
      direction,          // "DEBIT" | "CREDIT"

      meta,
    } = req.body;

    // 🔒 HARD VALIDATION (do not skip)
    if (
      !userId ||
      !walletId ||
      !category ||
      !channel ||
      !type ||
      !reference ||
      !direction
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required activity fields",
      });
    }

    /**
     * 🔑 CORE RULE
     * actorId = who initiated the action
     * For now, same as userId
     */
    const actorId = userId;

    const activity = await ActivityLog.create({
      // ownership
      userId,
      actorId,
      walletId,

      // classification
      category,
      channel,
      type,

      // display
      title,
      description,

      // money
      amount,
      reference,
      status: "PENDING",

      // direction logic (VERY IMPORTANT)
      direction, // "DEBIT" or "CREDIT"

      // optional counterpart
      counterpartyId: counterpartyId || null,
      counterpartyName: counterpartyName || null,

      // extra engine data
      meta: meta || {},
    });

    return res.status(201).json({
      success: true,
      activity,
    });
  } catch (error) {
    console.error("CREATE ACTIVITY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create activity log",
    });
  }
};

/**
 * UPDATE ACTIVITY STATUS
 * Called after bank / transaction resolves
 */
export const updateActivityStatus = async (req, res) => {
  try {
    const { reference } = req.params;
    const { status, reason } = req.body;

    const activity = await ActivityLog.findOneAndUpdate(
      { reference },
      {
        status,
        reason: reason || null,
        completedAt: ["SUCCESS", "FAILED", "REVERSED"].includes(status)
          ? new Date()
          : null,
      },
      { new: true }
    );

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    return res.json({
      success: true,
      activity,
    });
  } catch (error) {
    console.error("UPDATE ACTIVITY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update activity",
    });
  }
};

/**
 * GET USER ACTIVITIES (for Logs page)
 */
export const getUserActivities = async (req, res) => {
  try {
    const userId = req.user.id;

    const activities = await ActivityLog.find({ userId })
      .sort({ createdAt: -1, completedAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error("GET ACTIVITIES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch activities",
    });
  }
};

/**
 * GET SINGLE ACTIVITY
 */
export const getActivityByReference = async (req, res) => {
  try {
    const { reference } = req.params;

    const activity = await ActivityLog.findOne({ reference });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    return res.json({
      success: true,
      activity,
    });
  } catch (error) {
    console.error("GET ACTIVITY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch activity",
    });
  }
};