import jwt from 'jsonwebtoken';

export default function verifyAdminToken(req, res, next) {
  const token = req.cookies['asenix-admin-token']; // 👈 token from cookie

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No Token' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = verified;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid Token' });
  }
}
