import express from "express";

import {
  earlyWithdraw,
  completeEarlyWithdraw,
  failEarlyWithdraw,
  verifyEarlyWithdrawOtp,
  earlyWithdrawStatus,
} from "./earlyWithdrawController.js";

import protect from "../middleware/authMiddleware.js";
import { securityGuard } from "../middleware/securityGuard.js";
import { previewEarlyWithdraw } from "./previewEarlyWithdraw.js"; // leave this if you are still using it

const router = express.Router();

// INIT early withdraw
router.post(
  "/withdraw",
  protect,
  securityGuard,
  earlyWithdraw
);

// COMPLETE early withdraw
router.post(
  "/complete",
  protect,
  securityGuard,
  completeEarlyWithdraw
);

// FAIL early withdraw
router.post(
  "/fail",
  protect,
  securityGuard,
  failEarlyWithdraw
);

// PREVIEW (unchanged)
router.post(
  "/preview",
  protect,
  previewEarlyWithdraw
);

// VERIFY OTP
router.post(
  "/verify-otp",
  verifyEarlyWithdrawOtp
);

// STATUS
router.get(
  "/status",
  earlyWithdrawStatus
);

export default router;