import jwt from "jsonwebtoken";

export function verifyToken(req, res, next) {
  // read cookie first, then fall back to Authorization header
  const cookieToken = req.cookies?.token;
  const auth = req.headers?.authorization || "";
  const bearerToken = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  const token = cookieToken || bearerToken;
  if (!token) return res.status(401).json({ error: "token_missing" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "token_invalid" });
  }
}
