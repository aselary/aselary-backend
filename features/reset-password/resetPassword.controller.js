import User from "../models/User.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import isDev from "../utils/isDev.js";

export const resetPassword = async (req, res) => {
  try {
    const { userId, newPassword, confirmPassword } = req.body;

    // Step 1: Validate input
    if (!userId || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Step 2: Match passwords
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    // Step 3: Check for valid user ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID format." });
    }

    // Step 4: Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Step 5: Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.resetOTP = null;
    user.resetOTPExpiry = null;
    await user.save();

    // Step 6: Respond
    res.status(200).json({ message: "Password reset successful." });

  } catch (error) {
    if (isDev) {
    console.error("Reset Password Error:", error);
    }
    res.status(500).json({ message: "Server error while resetting password." });
  }
};