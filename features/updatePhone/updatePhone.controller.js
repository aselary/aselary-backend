import User from "../models/User.js";
import isDev from "../utils/isDev.js";

export const updatePhone = async (req, res) => {
  try {
    const { userId, newPhoneNumber } = req.body;

    // 1) Validate input
    if (!userId || !newPhoneNumber) {
      return res.status(400).json({
        message: "userId and newPhoneNumber are required.",
      });
    }

    // 2) Make sure phone number is not used by another user
    const conflict = await User.findOne({
      phoneNumber: newPhoneNumber,
      _id: { $ne: userId }, // exclude this user
    });

    if (conflict) {
      return res.status(400).json({
        message: "Phone number already in use.",
      });
    }

    // 3) Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // 4) Allow phone update ONLY after email verification
    if (!user.emailVerified) {
      return res.status(400).json({
        message: "Verify email first before changing phone number.",
      });
    }

    // 5) Update phone number
    user.phoneNumber = newPhoneNumber;
    user.phoneVerified = false; // optional
    await user.save(); // 🔥 MOST IMPORTANT LINE

    return res.status(200).json({
      message: "Phone number updated successfully.",
      phoneNumber: user.phoneNumber,
    });
  } catch (error) {
    if (isDev) {
    console.error("UPDATE PHONE ERROR:", error);
    }
    return res.status(500).json({
      message: "Server error while updating phone number.",
    });
  }
};