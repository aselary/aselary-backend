import "../../loadENV.js";
import User from "../models/User.js";
import nodemailer from "nodemailer";
import isDev from "../utils/isDev.js";

if (isDev) {
console.log("RESET OTP CONTROLLER LOADED");
console.log("ENV:", process.env.GMAIL_USER);
}

export const generateResetOTP = async (req, res) => {
  try {
    const { email,  } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.resetOTP = otp;
    user.resetOTPExpiry = otpExpiry;
    await user.save();

    // Setup nodemailer transporter
   const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
   tls: {
    rejectUnauthorized: isDev,
    },
      connectionTimeout: 60000,
});           // PROD = strict TLS

    const mailOptions = {
  from: '"Aselary Login Assistance" <noreply@aselarydm.com>',
  to: email,
  subject: '🔐 Your Aselary Password Reset OTP',
  html: `
 <div style="max-width: 480px; margin: auto; font-family: Arial, sans-serif; padding: 20px;">

  <!-- Logo -->
  <div style="text-align: center; margin-bottom: 25px;">
    <img src="https://res.cloudinary.com/dxjzjy4wt/image/upload/v1732737161/aselary-logo-white_nasdc0.png" 
         alt="Aselary Logo" 
         style="width: 120px;">
  </div>

  <!-- Main Card -->
  <div style="
      background: #ffffff; 
      padding: 25px; 
      border-radius: 12px; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-top: 4px solid #0d6efd;
  ">

    <h2 style="
        font-size: 22px; 
        color: #0d6efd; 
        margin-top: 0; 
        text-align: center;
    ">
      Password Reset Request
    </h2>

    <p style="font-size: 15px; color: #555; line-height: 1.6;">
      You requested to reset the password for your 
      <strong>Aselary SmartSave™</strong> account.
      <br><br>
      Use the OTP code below to continue your password reset:
    </p>

    <!-- OTP BOX -->
    <div style="
        margin: 30px auto; 
        width: fit-content;
        background: #eef4ff; 
        color: #0d6efd; 
        border-radius: 8px; 
        padding: 14px 26px; 
        font-size: 28px; 
        font-weight: bold; 
        letter-spacing: 6px; 
        border: 1px solid #cddaff;
    ">
      ${otp}
    </div>

    <p style="font-size: 15px; color: #555; text-align: center;">
      This OTP expires in <strong>10 minutes</strong>.
    </p>

    <p style="font-size: 14px; color: #777; line-height: 1.6; margin-top: 25px;">
      If you did not request a password reset, you can safely ignore this email.  
      <br>
      Your account remains secure.
    </p>

    <p style="margin-top: 35px; font-size: 14px; color: #333; text-align: center;">
      Regards, <br>
      <strong>The Aselary Team</strong>
    </p>

  </div>

  <!-- Footer -->
  <p style="text-align: center; font-size: 12px; color: #aaa; margin-top: 20px;">
    © 2025 Aselary SmartSave™. All rights reserved.
  </p>

</div>
  `
};


    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "OTP sent successfully to your email." });

  } catch (error) {
    if (isDev) {
    console.error("Generate OTP Error:", error);
    }
    return res.status(500).json({ message: "Server error while generating OTP." });
  }
};
