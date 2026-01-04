export const attachVerifiedUser = async (req, res, next) => {
  const verifiedUserId = req.headers["x-user-id"]; // sent from frontend securely

  if (!verifiedUserId) {
    return res.status(401).json({ message: "Missing verified user ID." });
  }

  req.userId = verifiedUserId;
  next();
};
