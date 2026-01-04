import { Router } from "express";
import { getSavingsStreak } from "./savingController.js";
import protect from  "../middleware/authMiddleware.js"; // if you have JWT auth

const router = Router();

// If you have auth, keep it. Otherwise remove `auth`.
router.get("/streaks/savings",  protect,  getSavingsStreak);

export default router;
