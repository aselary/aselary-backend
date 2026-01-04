import express from "express";
import { getMe } from "./me.controller.js";
import  protect  from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMe);

export default router;
