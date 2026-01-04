// backend/features/phone-otp/phoneOtp.routes.js
import express from "express";
import { resendPhoneOTP } from "./resendPhone.controller.js";

const router = express.Router();

router.post("/resend-phone-otp", resendPhoneOTP);


export default router;