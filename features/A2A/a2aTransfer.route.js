import express from "express";
import { a2aTransfer } from "./a2aTransfer.controller.js";
import protect from "../middleware/authMiddleware.js";
import { securityGuard } from "../middleware/securityGuard.js";
import { previewA2A } from "./previewA2A.js";

const router = express.Router();

router.post("/a2a-transfer", protect, securityGuard, a2aTransfer);
router.post("/a2a-preview", previewA2A)


export default router;