import "../loadENV.js";
import nodemailer from "nodemailer";
import isDev from "../features/utils/isDev.js";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  tls: {
  rejectUnauthorized: false,
     },
});

// verify transporter
transporter.verify((err) => {
  if (err) {
    if (isDev) {
    console.log("❌ Email Transporter Error:", err);
    }
  } else {
    if (isDev) {
    console.log("📨 Email Transporter Ready");
    }
  }
});