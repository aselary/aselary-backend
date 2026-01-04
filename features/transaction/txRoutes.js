// routes/txRoutes.js  (user routes)
import { Router } from "express";
import { txController } from "./txController.js";
import protect from "../middleware/authMiddleware.js";

const r = Router();
r.get("/mine", protect, txController.mine);
export default r;