import User from "../models/User.js";
import isDev from "../utils/isDev.js";

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ message: "Email and OTP are required." });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check OTP expired
    if (!user.emailOTP || !user.emailOTPExpiry) {
      return res.status(400).json({ message: "No OTP found. Request a new one." });
    }

    if (Date.now() > user.emailOTPExpiry) {
      return res
        .status(400)
        .json({ message: "OTP has expired. Request a new one." });
    }

    // Check OTP match
    if (user.emailOTP !== otp) {
      return res
        .status(400)
        .json({ message: "Invalid OTP. Please try again." });
    }

    // ✅ Success → update user
    user.emailVerified = true;
    user.emailOTP = null;
    user.emailOTPExpiry = null;

    await user.save();

    return res.status(200).json({
      message: "Email verified successfully.",
      userId: user._id,
    });
  } catch (error) {
    if (isDev) {
    console.error("VERIFY EMAIL ERROR:", error);
    }
    return res
      .status(500)
      .json({ message: "Server error. Try again." });
  }
};




// controllers/auth/resetSignup.controller.js
export const resetSignup = async (req, res) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).json({ message: "Email or phone required" });
  }

  await User.deleteOne({
    tempUser: true,
    $or: [
      email ? { email } : null,
      phoneNumber ? { phoneNumber } : null,
    ].filter(Boolean),
  });

  return res.json({ message: "Signup reset successful" });
};