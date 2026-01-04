import express from "express";
import { getAllAdminTransactions } from "./admin.transactions.controller.js";
import { authAdmin } from "../middlewares/authAdmin.js";

const router = express.Router();

router.get(
  "/transactions",
  authAdmin,
  getAllAdminTransactions
);

export default router;