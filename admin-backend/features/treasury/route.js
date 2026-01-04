import express from "express";
import { getTotalSavings } from "./controller.js";
import { getCurrentBalance } from "./controller.js";
const router = express.Router();

// GET /api/admin/total-savings
router.get("/total-savings", getTotalSavings);
router.get("/current-balance", getCurrentBalance);

export default router;
