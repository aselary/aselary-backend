import express from "express";
import { cashOut } from "./withdrawal.controller.js";
import protect from "../middleware/authMiddleware.js";
import { securityGuard } from "../middleware/securityGuard.js";

const router = express.Router();

router.post("/cash-out", protect, securityGuard, cashOut);

export default router;