import FraudLog from "../models/FraudLog.js";
import { calculateRisk } from "../utils/securityEngine.js";
import isDev from "../utils/isDev.js";

export async function securityGuard(req, res, next) {
  try {

    // ✅ BYPASS security checks for resolve endpoints
    if (
      req.path.includes("/to-bank/complete") ||
      req.path.includes("/to-bank/fail")
    ) {
      return next();
    }
    
if (isDev) {
    console.log("🧪 SECURITY GUARD CHECK");
console.log("➡️ PATH:", req.path);
console.log("➡️ req.user:", req.user);
console.log("➡️ req.user?.id:", req.user?.id);
console.log("➡️ headers.authorization:", req.headers.authorization);
}
    
   if (!req.user || !req.user.id) {
  return res.status(401).json({ error: "unauthorized" });
}

const userId = req.user.id;
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.ip ||
      "unknown";

    const userAgent = req.headers["user-agent"] || "unknown";

const receiverId = req.body.toUserId || req.body.toAccount || null;

const attempts = await FraudLog.countDocuments({
  userId,
  receiverId,
  endpoint: req.path,
  createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
});

const amount = Number(req.body.amount || 0);

/* 🔒 RISK CALCULATION — MATCHES SECURITY ENGINE */
const riskResult = calculateRisk({
  amount,
  attempts,
  ip,
  userAgent,
});

/* 📝 Save log for tracking */
await FraudLog.create({
  userId,
  receiverId,
  ip,
  userAgent,
  endpoint: req.path,
  attempts,
  riskScore: riskResult.score,
});

// 🧠 ALLOW OWNER / ADMIN BYPASS
const DEV_USER = "6973d7c5a583cada6f591822"; // put your Mongo user id

if (req.user && req.user.id === DEV_USER) {
  if (isDev) {
 console.log("🟢 DEV BYPASS ACTIVE");
  }
 return next();
}

console.log("🛑 SECURITY BLOCK CHECK");
console.log("riskResult:", riskResult);
console.log("blocked:", riskResult?.blocked);
console.log("score:", riskResult?.score);
console.log("reference:", req.body.reference);
console.log("user:", req.user?.id);

if (riskResult.blocked && !req.body.reference) {
  console.log("🚨🚨🚨 403 TRIGGERED HERE 🚨🚨🚨");
  return res.status(403).json({
    success:false,
    message: riskResult.reason || "High risk action blocked"
  });
}

// ⚠️ THROTTLE medium risk
if (riskResult.score >= 75) {
 return res.status(429).json({
  success:false,
  message:"Too many rapid transfer to this recipient."
 });
}

return next();

/* ✅ SAFE */
return next();
  } catch (err) {
   if (isDev) {
    console.log("SecurityGuard error:", err);
  }
    return res.status(500).json({
      success: false,
      message: "Internal security engine error.",
    });
  }
}