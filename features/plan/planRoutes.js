import express from "express";
import { createPlan, getMyPlans } from "./planController.js";
import protect from  "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, createPlan);
router.get("/my-plans", protect, getMyPlans);

export default router;