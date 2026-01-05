// src/controllers/auth/resetSignup.controller.js
import User from "../../models/User.js";

export const resetSignup = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({
        message: "Email or phone number required",
      });
    }

    // 🔥 DELETE ONLY ON EXPLICIT REQUEST
    await User.deleteOne({
      tempUser: true,
      $or: [
        email ? { email } : null,
        phoneNumber ? { phoneNumber } : null,
      ].filter(Boolean),
    });

    return res.json({
      ok: true,
      message: "Signup reset successful",
    });
  } catch (error) {
    console.error("RESET SIGNUP ERROR:", error);
    return res.status(500).json({
      message: "Failed to reset signup",
    });
  }
};