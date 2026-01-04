import { Router } from "express";
const router = Router();
import verifyTokenController from "../verifyToken/verifyTokenController.js";

router.get("/", verifyTokenController);

export default router;
