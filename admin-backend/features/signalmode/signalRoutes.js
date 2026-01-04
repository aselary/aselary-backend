import express from "express";
import {
  createSignalNode,
  getSignalNodes,
  deleteSignalNode,
  toggleSignalNode,
} from "./signalController.js";

const router = express.Router();

router.post("/", createSignalNode);
router.get("/all", getSignalNodes);
router.delete("/:id", deleteSignalNode);
router.put("/toggle/:id", toggleSignalNode);

export default router;
