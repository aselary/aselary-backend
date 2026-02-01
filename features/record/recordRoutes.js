import express from "express";
import { addRecord, getMyRecords } from "./recordController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", protect, addRecord);
router.get("/my", protect, getMyRecords)

export default router;