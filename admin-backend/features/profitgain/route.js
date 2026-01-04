import express from "express";
import { getPlatformGain } from "./controller.js";

const router = express.Router();
router.get("/platform-gain", getPlatformGain);

export default router;
