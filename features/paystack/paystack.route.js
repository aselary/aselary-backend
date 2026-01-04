import express from "express";
import { verifyPaystackPayment } from "./paystack.controller.js";

const router = express.Router();

router.get("/verify", verifyPaystackPayment);

export default router;