import express from "express";
import { createPayoutFromExecutedSettlement } from "./createPayout.controller.js";
import { authAdmin } from "../middlewares/authAdmin.js";

const router = express.Router();

/**
 * CREATE PAYOUT FROM EXECUTED SETTLEMENT
 */
router.post(
  "/create-from-settlement",
  authAdmin,
  createPayoutFromExecutedSettlement
);

export default router;