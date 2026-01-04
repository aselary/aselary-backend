import express from "express";
import { createSettlementRecord, executeSettlement, getSettlementHistory, closeSettlementFinal } from "./settlement.controller.js";

const router = express.Router();

router.post("/settlement/create", createSettlementRecord);
router.post("/settlement/execute", executeSettlement);
router.get("/settlement/history", getSettlementHistory);
router.post("/settlement/close-final", closeSettlementFinal);

export default router;