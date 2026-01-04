// routes/auth.routes.js
import express from "express";
import { updatePhone } from "./updatePhone.controller.js";

const router = express.Router();

router.post("/update-phone", updatePhone);

export default router;