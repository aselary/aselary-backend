import express from "express";
import { initUSSD } from "./ussd.controller.js";

const router = express.Router();

router.post("/init", initUSSD);

export default router;