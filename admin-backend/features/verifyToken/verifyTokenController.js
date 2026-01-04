import jwt from "jsonwebtoken";

const verifyTokenController = (req, res) => {


  const token = req.cookies["asenix-admin-token"];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({ user: decoded });
  } catch (err) {
    return res.status(403).json({ message: "Token verification failed", error: err.message });
  }
};

export default verifyTokenController;
