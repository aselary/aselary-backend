import { Router } from "express";
const router = Router();
import { getUserInterest } from "./user.controller.js";
import protect from  "../middleware/authMiddleware.js";

router.get("/interest", protect, getUserInterest); // <-- this is what the frontend is calling

export default router;

