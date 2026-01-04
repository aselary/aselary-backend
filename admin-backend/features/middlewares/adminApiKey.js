export default function adminApiKey(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Missing admin API key",
    });
  }

  const token = auth.replace("Bearer ", "").trim();

  if (token !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({
      success: false,
      message: "Invalid admin API key",
    });
  }

  // ✅ no req.user needed
  next();
}