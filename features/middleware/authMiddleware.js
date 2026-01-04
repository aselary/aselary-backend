import jwt from "jsonwebtoken";
import User from "../models/User.js";
import isDev from "../utils/isDev.js";

export default async function protect(req, res, next) {
   
if (isDev) {
  console.log("🔥 REQUEST →", req.originalUrl);
  console.log("🧾 AUTH →", req.headers.authorization);
}

  try {
    if (req.path === "/health") return next();

    const auth =
      req.headers.authorization || req.headers.Authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "no_token" });
    }

    const token = auth.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      const msg =
        e.name === "TokenExpiredError"
          ? "token_expired"
          : "token_invalid";
      return res.status(401).json({ error: msg });
    }

    const userId = decoded.userId || decoded.id || decoded._id;
       
  if (isDev) {
    console.log("DECODED TOKEN:", decoded);
  }

    if (!userId) {
      return res.status(401).json({ error: "invalid_token_payload" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({ error: "user_not_found" });
    }

    // ✅ STANDARDIZED
    req.user = {
      id: user._id.toString(),
    };

    next();
  } catch (err) {
    return res.status(500).json({ error: "auth_failed" });
  }
}