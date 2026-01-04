import express from "express";
import { createSignal, getSignals } from "./controller.js";

const router = express.Router();

router.post("/create", createSignal);
router.get("/all", getSignals);

export default router;
