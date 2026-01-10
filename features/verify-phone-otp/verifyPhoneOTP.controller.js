import User from "../models/User.js";
import isDev from "../utils/isDev.js";
import { createWalletInfrastructureOnSignup } from "../services/createWalletInfrastructureOnSignup.js";


export const verifyPhoneOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: "userId and OTP are required." });
    }

    // Find user by ID (NOT by phone number)
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check OTP match
    if (user.phoneOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Check OTP expiry
    if (user.phoneOTPExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired." });
    }

// SUCCESS - VERIFY THE PHONE
user.phoneVerified = true;
user.phoneOTP = null;
user.phoneOTPExpiry = null;

// Activate account fully when phone is verified
user.tempUser = false;
user.status = "confirmed";


// after OTP verification + user activation
const bankData = await createWalletInfrastructureOnSignup(user);

await user.save();

return res.status(200).json({
  success: true,
  message: "Phone number verified successfully",
  aliasAccountNumber: bankData.aliasAccountNumber,
  paystackDVA: bankData.paystackDVA,
  hasRealBank: bankData.hasRealBank,
  customerCode: bankData.customerCode,
});

  } catch (error) {
    if (isDev) {
    console.log("VERIFY PHONE ERROR:", error);
    }
    return res.status(500).json({ message: "Server error." });
  }
};