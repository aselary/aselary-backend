import User from "../models/User.js";
import sendSMS from "../utils/sendSMS.js";

export const generatePhoneOTP = async (req, res) => {
  try {
    const { userId, phoneNumber, skip } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
     
    
    // ✅ SKIP FLOW
    if (skip === true) {
      user.phoneVerificationSkipped = true;
      user.phoneVerified = false;
      await user.save();

      return res.json({
        success: true,
        skipped: true,
        message: "Phone verification skipped",
      });
    }

    if (!phoneNumber) {
      return res.status(400).json({ message: "phoneNumber is required" });
    }

    let otp;
    if (process.env.NODE_ENV !== "production") {
      otp = "999999"; // dev only
    } else {
      otp = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const otpExpires = Date.now() + 10 * 60 * 1000;

    user.phoneNumber = phoneNumber;
    user.phoneOTP = otp;
    user.phoneOTPExpiry = otpExpires;
    user.phoneVerified = false;

    await user.save();

    // ✅ SEND SMS ONLY IN PRODUCTION
    if (process.env.NODE_ENV === "production") {
      await sendSMS(
        phoneNumber,
        `Your Aselary verification code is ${otp}`
      );
    }

    return res.json({
      success: true,
      message: "OTP process started",
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
