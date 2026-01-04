import express from "express";
// features/transactions/tx.routes.js
const router = express.Router();
import protect from  "../middleware/authMiddleware.js";  // your JWT guard
import { getRecentTx, getBreakdown } from "./smartPlanController.js";

router.get("/recent", protect, getRecentTx);
router.get("/breakdown", protect, getBreakdown);

export default router;

