import express from "express";
import { verifyEmail } from "./verifyOTP.controller.js";

const router = express.Router();

router.post("/verify-email", verifyEmail);

export default router;