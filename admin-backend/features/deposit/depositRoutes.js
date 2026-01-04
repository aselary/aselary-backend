import express from "express";
import { getAllDeposits } from "./depositController.js";

const router = express.Router();

// GET all deposits
router.get("/", getAllDeposits);

export default router;
