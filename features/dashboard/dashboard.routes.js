// features/dashboard/dashboard.routes.js
import express from "express";
import { getSmartBalance } from "./getBalance.controller.js";
import protect from  "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/dashboard/smart-balance
router.get("/smart-balance", protect, getSmartBalance);

export default router;