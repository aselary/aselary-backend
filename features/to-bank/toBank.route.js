import express from "express";
import { 
   toBankTransfer,
   completeToBankTransfer,
   failToBankTransfer
 } from "./toBank.controller.js";
import protect from "../middleware/authMiddleware.js";
import { securityGuard } from "../middleware/securityGuard.js";
import { previewToBankTransfer } from "./previewToBank.js";

const router = express.Router();

router.post("/to-bank", protect, securityGuard, toBankTransfer);
router.post("/to-bank/complete", protect, securityGuard, completeToBankTransfer);
router.post("/to-bank/fail", protect, securityGuard, failToBankTransfer);
router.post("/preview", protect, previewToBankTransfer);

export default router;