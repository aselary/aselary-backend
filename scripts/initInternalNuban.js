// scripts/initInternalNuban.js
import mongoose from "mongoose";
import InternalNubanSequence from "../features/models/InternalNubanSequence.js";
import isDev from "../features/utils/isDev.js";

const exists = await InternalNubanSequence.findOne();
if (!exists) {
  await InternalNubanSequence.create({ era: 70, counter: 0 });
  if (isDev) {
  console.log("Internal NUBAN sequence initialized");
  }
}

process.exit();