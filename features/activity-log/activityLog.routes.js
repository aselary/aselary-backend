import express from "express";
import {
  createActivity,
  updateActivityStatus,
  getUserActivities,
  getActivityByReference,
} from "./activityLog.controller.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();


router.post("/", protect, createActivity);

router.patch("/:reference/status", protect, updateActivityStatus);

router.get("/me", protect, getUserActivities);

router.get("/:reference", protect, getActivityByReference);

export default router;