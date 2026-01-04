// backend/features/phone-otp/phoneOtp.routes.js
import express from "express";
import { generatePhoneOTP } from "./phoneOtp.controller.js";

const router = express.Router();

router.post("/skip-phone", generatePhoneOTP);


export default router;