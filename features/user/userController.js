// controllers/userController.js
import User from "../models/User.js";

export async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "user_not_found" });
    res.json({ ok: true, user });
  } catch {
    res.status(500).json({ error: "server_error" });
  }
}

export async function updateAvatar(req, res) {
  try {
    const { url } = req.body;            // url from Cloudinary upload step
    if (!url) return res.status(400).json({ error: "missing_url" });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: url },
      { new: true, runValidators: true, select: "-password" }
    );
    if (!user) return res.status(404).json({ error: "user_not_found" });

    res.json({ ok: true, user, message: "avatar_updated" });
  } catch (e) {
    res.status(500).json({ error: "server_error" });
  }
}