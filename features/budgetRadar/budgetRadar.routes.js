import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getBudgetRadar } from "./budgetRadar.controller.js";

const router = express.Router();

router.get("/radar", protect, getBudgetRadar);

export default router;