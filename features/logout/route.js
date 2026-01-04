import express from 'express';

const router = express.Router();

router.post('/', (_req, res) => {
  // Clear the auth cookie (replace 'token' with your cookie name)
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
  });

  return res.status(200).json({ message: 'Logged out successfully' });
});

export default router;