import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import isDev from '../utils/isDev.js';


const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const needsPhoneVerification = !user.phoneVerified;

    if (!user.emailVerified) {
  return res.status(403).json({
    message: "Please verify your email first.",
    requireVerification: true,
    userId: user._id
  }); 
}


   const isProd = process.env.NODE_ENV === "production";

    // Create JWT payload
    const payload = {
      id: user._id,
      fullName: user.fullName,
      email: user.email
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: isProd ? '15m' : '7d',
      issuer: "aselary-api",
      audience: "aselary-mobile"
    });

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd, // change to true in production (HTTPS)
      sameSite: isProd ? "Strict" : "Lax",
      path: '/',
      maxAge: isProd ? 15 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return success response
    return res.status(200).json({
      message: 'Sign in successful!',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        photo: user.photo
      },
      needsPhoneVerification
    });

  } catch (error) {
    if (isDev) {
    console.error('Error during sign-in:', error);
    }
    return res.status(500).json({ error: 'Server error. Please try again later.' });
  }
};

export default signin;
