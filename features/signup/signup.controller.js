import "../../loadENV.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../config/mailer.js";
import { validatePersonalName } from "../utils/validatePersonalName.js"; 

export const signup = async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber } = req.body;


    if (!fullName || !email || !password || !phoneNumber) {
      return res.status(400).json({ message: "All fields are required." });
    }


if (fullName.trim().split(" ").length < 2) {
  return res.status(400).json({ 
    message: "Enter your full name (first and last name)."
  });
}


    const nameCheck = validatePersonalName(fullName);

    if (!nameCheck.valid) {
      return res.status(400).json({
        message:
          "Only personal names are allowed. Business or corporate names are not supported.",
      });
    }


const formattedFullName = fullName.trim().toUpperCase();


    const hashedPassword = await bcrypt.hash(password, 10);


    const existing = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });

   if (existing) {
  // Allow retry if NOT verified
  if (!existing.emailVerified) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 15 * 60 * 1000;

    existing.emailOTP = otp;
    existing.emailOTPExpiry = otpExpiry;
    existing.email = email;
    existing.phoneNumber = phoneNumber;
    existing.fullName = formattedFullName;
    existing.password = hashedPassword;

    await existing.save();

    await sendEmail({
      to: email,
       subject: "Your Aselary Verification Code",
      html: `<div style="max-width: 480px; margin: auto; font-family: Arial, sans-serif; padding: 20px;">

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
      ${otp}
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
    © 2026 Aselary SmartSave™. All rights reserved.
  </p>

</div>`,
    });


    return res.status(200).json({
      message: "Verification code resent.",
      userId: existing._id,
    });
  }

  // Block ONLY if verified user
  return res.status(400).json({
    message:
      existing.email === email
        ? "Email already exists."
        : "Phone number already exists.",
  });
}

    // ---------------------------


    // ---------------------------
    // 5) GENERATE OTP
    // ---------------------------
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    // ------------------------------
// 7. CREATE NEW USER FIRST
// ------------------------------
const newUser = new User({
  fullName: formattedFullName,
  email,
  password: hashedPassword,
  phoneNumber,
  emailOTP: otp,
  emailOTPExpiry: otpExpiry,
  emailVerified: false,
  phoneVerified: false,
  tempUser: true,
  status: "pending",
});

// save user first
await newUser.save();



    // ---------------------------
    // 8) CREATE JWT TOKEN
    // ---------------------------
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    
try {
    // 7) Send OTP email (same mail format you already have)
    await sendEmail({
      to: email,
      subject: "Your Aselary Verification Code",
      html: `<div style="max-width: 480px; margin: auto; font-family: Arial, sans-serif; padding: 20px;">

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
      ${otp}
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
    © 2026 Aselary SmartSave™. All rights reserved.
  </p>

</div>`,
    });

 } catch (err) {
  console.error("OTP EMAIL FAILED:", err.message);
}

// 4. ALWAYS return success
return res.status(201).json({
  message: "Signup successful. Please verify your email.",
  user: {
    id: newUser._id,
    fullName: newUser.fullName,
    email: newUser.email,
    phoneNumber: newUser.phoneNumber,
    accountNumber: newUser.accountNumber,
  },
  token,
});
  } catch (error) {

    console.error("SIGNUP ERROR:", error);
    
    return res.status(500).json({ message: "Server error. Try again." });
  }
};