import express from "express";
import {
    getTreasuryPayouts, 
    attachRecipientToPayout, 
    executeTreasuryPayout, 
    getTreasuryRecipients, 
    getExecutionLogs 
} from "./treasuryPayout.controller.js";
import { authAdmin } from "../middlewares/authAdmin.js";

const router = express.Router();

// READ ONLY — Disbursement Status (Step 4.5)
router.get("/payouts", authAdmin, getTreasuryPayouts);
router.post("/attach-recipient", authAdmin, attachRecipientToPayout);
router.post("/execute", authAdmin, executeTreasuryPayout);
router.get("/recipients", getTreasuryRecipients);
router.get("/execution-logs", authAdmin, getExecutionLogs);

export default router;