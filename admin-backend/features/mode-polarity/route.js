import express from "express";
import { getPolarity, updatePolarity } from "./controller.js";

const router = express.Router();

router.get("/get", getPolarity);
router.patch("/update", updatePolarity);

export default router;
