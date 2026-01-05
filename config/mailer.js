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
    rejectUnauthorized: false, // ✅ strict in production
  },
  connectionTimeout: 60_000,
  greetingTimeout: 30_000,
});

