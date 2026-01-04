// backend/features/phone-otp/phoneOtp.routes.js
import express from "express";
import { verifyPhoneOTP } from "./verifyPhoneOTP.controller.js";

const router = express.Router();

router.post("/verify-phone", verifyPhoneOTP);


export default router;