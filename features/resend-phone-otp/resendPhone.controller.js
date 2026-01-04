import User from "../models/User.js";
import sendSMS from "../utils/sendSMS.js";

export const resendPhoneOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number required" });
    }

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    user.phoneOTP = otp;
    user.phoneOTPExpiry = otpExpires;
    user.phoneVerified = false;

    await user.save();

    await sendSMS(phoneNumber, `Your Aselary verification code is: ${otp}`);

    res.status(200).json({
      success: true,
      message: "OTP resent successfully",
      otp: otp, // remove later
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};