import express from "express";
import { resendEmailOTP } from "./resendOTPController.js";

const router = express.Router();

router.post("/resend-otp", resendEmailOTP);

export default router;