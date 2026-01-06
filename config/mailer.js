import "../loadENV.js";
import nodemailer from "nodemailer";
import isDev from "../features/utils/isDev.js";

let transporter;

if (isDev) {
  // ======================
  // DEVELOPMENT (LOCAL)
  // ======================
  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,     // e.g. Mailtrap
    port: Number(process.env.MAIL_PORT),
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  transporter.verify((err) => {
    if (err) {
      console.error("❌ DEV Mail error:", err);
    } else {
      console.log("✅ DEV Mail ready");
    }
  });

} else {
  // ======================
  // PRODUCTION (RENDER)
  // ======================
  transporter = nodemailer.createTransport({
    host: "smtp.resend.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.RESEND_API_KEY,
      pass: process.env.RESEND_API_KEY,
    },
  });
}

export default transporter;