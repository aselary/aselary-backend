import express from "express";
import { initUSSD, ussdWebhook } from "./ussd.controller.js";

const router = express.Router();

router.post("/init", initUSSD);
router.post("/webhook", express.raw({ type: "application/json" }), ussdWebhook);

export default router;