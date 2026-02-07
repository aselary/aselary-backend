import express from "express";
import { 
   withdrawFunds,
   completeWithdrawFund,
   failWithdrawFund,
   verifyWithdrawFundOtp,
   WithdrawFundStatus
 } from "./withdrawFunds.controller.js";
import protect from "../middleware/authMiddleware.js";
import { securityGuard } from "../middleware/securityGuard.js";
import { previewWithdrawFunds } from "./previewWithdrawFunds.js";

const router = express.Router();

router.post("/fund", protect, securityGuard, withdrawFunds);
router.post("/complete", protect, securityGuard, completeWithdrawFund);
router.post("/fail", protect, securityGuard, failWithdrawFund);
router.post("/preview", protect, previewWithdrawFunds);
router.post("/verify-otp", verifyWithdrawFundOtp);
router.get("/status", WithdrawFundStatus);

export default router;