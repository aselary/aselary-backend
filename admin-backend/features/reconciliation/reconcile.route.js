import express from "express";
import { reconcilePaystackController } from "./reconcile.controller.js";
import { authAdmin } from "../middlewares/authAdmin.js";
import { forceAcceptReconciliation } from "./reconcile.service.js";

const router = express.Router();

router.get( "/paystack", authAdmin,  reconcilePaystackController );
router.post( "/force", authAdmin, forceAcceptReconciliation);

export default router;