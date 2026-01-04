// aselary-backend/routes/userRoutes.js
import { Router } from "express";
import protect  from "../middleware/authMiddleware.js";
import { updateAvatar, me } from "./userController.js";

const router = Router();

// POST /api/user/avatar  { photo: "https://..." }
router.put("/avatar", protect, updateAvatar);
router.get("/me", protect, me)

export default router;