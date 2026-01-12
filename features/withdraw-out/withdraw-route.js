import express from "express";
import { withdrawToBank } from "./withdraw.controller.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/withdraw", protect, withdrawToBank);

export default router;