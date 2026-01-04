import express from "express";
import { resendResetOtp } from "./resetOTP.controller.js";

const router = express.Router();

// resend OTP for password reset
router.post("/resend-reset-otp", resendResetOtp);

export default router;