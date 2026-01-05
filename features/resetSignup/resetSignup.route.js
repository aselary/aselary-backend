// src/routes/auth/resetSignup.route.js
import express from "express";
import { resetSignup } from "./resetSignup.controller.js";

const router = express.Router();

// 🔥 Explicit reset only
router.post("/reset-signup", resetSignup);

export default router;