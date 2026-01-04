import express from "express";
import { initCardDeposit, verifyCardDeposit } from "./depositController.js";

const router = express.Router();

// ⚠️ DO NOT ADD securityGuard HERE — already global in app.js
router.post("/init", initCardDeposit);
router.get("/verify", verifyCardDeposit);

export default router;