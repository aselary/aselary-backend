import express from "express";
import  protect  from "../middleware/authMiddleware.js";
import {
  getBankTransferInfo,
  getAccountInfo,
  ensureAccountNumber,
  getVirtualAccount,
} from "./walletController.js";
import { lookupWalletAccount } from "./lookupWallet.controller.js";

const router = express.Router();

// Get wallet account number + balance
router.get("/account-number", protect, getAccountInfo);
router.get("/account", protect, getBankTransferInfo);


// Generate an account number if user doesn't have one yet
router.post("/generate", protect, ensureAccountNumber);
router.get("/transfer-info", protect, getVirtualAccount);
router.get("/lookup/:accountNumber", lookupWalletAccount);


export default router;

