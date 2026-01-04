export function authAdmin(req, res, next) {
  const sent =
    req.headers["x-admin-key"] ||
    req.headers["asenix-admin-token"] ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : undefined);

  const expected = (process.env.ADMIN_API_KEY || "").trim();
  const cleanSent = (sent || "").trim();

  if (!expected) {
    return res.status(500).json({ error: "Server misconfigured: ADMIN_API_KEY missing" });
  }
  if (!cleanSent || cleanSent !== expected) {
    return res.status(403).json({ error: "Forbidden: Invalid admin key" });
  }
  next();
}