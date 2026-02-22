import express from "express";
import { setFundingPlans } from "./setFundingPlans.controller.js";
import protect from  "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/set-funding-plans", protect, setFundingPlans);

export default router;