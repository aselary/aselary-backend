import User from "../models/User.js";

export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(req.user.id).select(
      "fullName email phoneNumber emailVerified phoneVerified"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber ?? "",
      emailVerified: user.emailVerified ?? false,
      phoneVerified: user.phoneVerified ?? false,
    });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
};