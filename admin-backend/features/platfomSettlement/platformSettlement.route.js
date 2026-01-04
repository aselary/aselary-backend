import express from "express";
import { previewSettlementController } from "./platformSettlement.controller.js";
import { authAdmin } from "../middlewares/authAdmin.js";

const router = express.Router();

/**
 * ADMIN — Preview platform settlement
 * GET /api/admin/settlement/preview
 */
router.get(
  "/preview",
  authAdmin,
  previewSettlementController
);

export default router;