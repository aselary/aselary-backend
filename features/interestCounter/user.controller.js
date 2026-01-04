// controllers/userController.js
import User from "../models/User.js"

export const getUserInterest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("interestBalance"); // make sure protect middleware adds req.user

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ interest: user.interestBalance });
  } catch (err) {
    console.error("🔥 Error in getUserInterest:", err.message);
    res.status(500).json({ error: "Server error", message: err.message });
  }
};