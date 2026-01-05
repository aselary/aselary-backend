import User from "../models/User.js";
import  transporter  from "../../config/mailer.js";


export const resendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: "Email already verified." });
    }

    // Generate new OTP
    const newOTP = Math.floor(100000 + Math.random() * 900000).toString();

    user.emailOTP = newOTP;
    user.emailOTPExpiry = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    // Send new OTP
    const mailOptions = {
      from: `Aselary Login Assistance <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your New Aselary Verification Code",
      html: `
        <div style="max-width: 480px; margin: auto; font-family: Arial, sans-serif; padding: 20px;">

  <!-- Logo -->
  <div style="text-align: center; margin-bottom: 25px;">
    <img src="https://res.cloudinary.com/ddiuf7k8k/image/upload/aselary_users/gmx10pi1awstnic6m5jc" 
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
      Verify Your Email
    </h2>

    <p style="font-size: 15px; color: #555; line-height: 1.6;">
      Hi there,
      <br><br>
      Thank you for creating an account on <strong>Aselary SmartSave™</strong>.  
      Please use the verification code below to confirm your email address.
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
      ${newOTP}
    </div>

    <p style="font-size: 15px; color: #555; text-align: center;">
      This code expires in <strong>10 minutes</strong>.
    </p>

    <p style="font-size: 14px; color: #777; line-height: 1.6; margin-top: 25px;">
      If you didn't request this, you can safely ignore the message.  
      <br>
      No changes will be made to your account.
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
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "A new OTP has been sent to your email.",
    });

  } catch (err) {
    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
};