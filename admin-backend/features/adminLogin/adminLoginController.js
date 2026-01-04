import Admin from '../adminLogin/adminModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import isDev from '../../../features/utils/isDev.js';

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Debugging log
    if (isDev) {
    console.log("Login attempt for email:", email);
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ message: "Access Denied: Admin not found" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Access Denied: Wrong password" });
    }
    if (isDev) {
console.log("SIGN SECRET:", process.env.JWT_SECRET);
    }
    // Generate token
    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
       
    if (isDev) {
      console.log("Generated TOKEN:", token); // 🔍 Debug line
    }
    
    // Set cookie for server-side access
    res.cookie('asenix-admin-token', token, {
      httpOnly: true,
      secure: false, // true in production
      sameSite: 'Lax',
      path: '/',
      maxAge:  60 * 60 * 24 * 7, // 7 days
    });

    // Return success response
    res.status(200).json({
      message: "Login Successful",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        phone: admin.phone,
      },
    });
    
  } catch (error) {
    if (isDev) {
    console.error("Login error:", error);
    }
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};
