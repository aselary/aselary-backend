import User from "../models/User.js";
import isDev from "../utils/isDev.js";

export const verifyResetOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    // ✅ Only check for OTP now (no email)
    if (!otp) {
      return res.status(400).json({ message: "OTP is required." });
    }

    // ✅ Find user by OTP only
    const user = await User.findOne({ resetOTP: otp });

    if (!user) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // ✅ Check expiry
    if (user.resetOTPExpiry < new Date()) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    // ✅ Success response
    return res.status(200).json({
      message: "OTP verified successfully.",
      userId: user._id,
    });

  } catch (error) {
    if (isDev) {
    console.error("Verify OTP Error:", error);
    }
    return res.status(500).json({ message: "Server error while verifying OTP." });
  }
};