import express from "express";
import { createTreasuryRecipient } from "./treasuryRecipient.controller.js";
import adminApiKey from "../middlewares/adminApiKey.js";


const router = express.Router();

router.post("/create", adminApiKey , createTreasuryRecipient);


export default router;