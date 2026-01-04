import express from "express";
import { getPlatformLedger } from "./platform.controller.js";
import { authAdmin } from "../middlewares/authAdmin.js";

const router = express.Router();

router.get("/ledger", authAdmin, getPlatformLedger);

export default router;