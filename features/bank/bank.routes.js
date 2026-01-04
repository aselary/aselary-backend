import express from "express";
import { getBanks, resolveBankAccount } from "./bank.controller.js";

const router = express.Router();

router.get("/banks", getBanks);
router.post("/banks/resolve", resolveBankAccount);

export default router;