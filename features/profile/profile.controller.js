import User from "../models/User.js";
import isDev from "../utils/isDev.js";

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      "fullName email phoneNumber createdAt emailVerified phoneVerified status"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const profilePayload = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phoneNumber,
      emailVerified: Boolean(user.emailVerified),
      phoneVerified: Boolean(user.phoneVerified),
      status: user.status,
      createdAt: user.createdAt,
    };
     
    if (isDev) {
    console.log("✅ PROFILE PAYLOAD SENT:", profilePayload);
    }

    return res.status(200).json({
      success: true,
      profile: profilePayload,
    });
  } catch (error) {
    if (isDev) {
    console.error("PROFILE ERROR:", error);
    }
    return res.status(500).json({
      success: false,
      message: "Unable to fetch profile",
    });
  }
};