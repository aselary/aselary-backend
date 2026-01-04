// config/mailer.js
import "../loadENV.js";
import nodemailer from "nodemailer";
import isDev from "../features/utils/isDev.js";

/**
 * SMTP Transporter
 * - Dev: relaxed TLS for local testing
 * - Prod: strict TLS
 */
export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS, // MUST be Gmail App Password
  },
  tls: {
    rejectUnauthorized: !isDev, // ✅ strict in production
  },
  connectionTimeout: 60_000,
  greetingTimeout: 30_000,
});

/**
 * Verify transporter ONLY in development
 * Never block or crash production startup
 */
if (isDev) {
  transporter.verify((err) => {
    if (err) {
      console.error("❌ Email Transporter Error:", err);
    } else {
      console.log("📧 Email Transporter Ready");
    }
  });
}

/**
 * Centralized mail sender
 * Prevents duplicate configs across app
 */
export const sendMail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: `"Aselary" <noreply@aselarydm.com>`,
    to,
    subject,
    html,
  });
};