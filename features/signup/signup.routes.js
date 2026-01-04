// signup.routes.js
import express from "express";
import { signup } from "./signup.controller.js";
import protect from  "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/signup", signup, protect);

export default router;