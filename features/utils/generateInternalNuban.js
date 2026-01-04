import InternalNubanSequence from "../models/InternalNubanSequence.js";

export async function generateInternalNuban() {
  // 1️⃣ Always fetch the single sequence document
  let seq = await InternalNubanSequence.findOne();

  // 2️⃣ If it doesn't exist, create it ONCE
  if (!seq) {
    seq = await InternalNubanSequence.create({
      era: 70,
      counter: 1,
    });
  } else {
    // 3️⃣ Increment counter safely
    seq.counter += 1;

    // 4️⃣ Handle rollover
    if (seq.counter > 99999999) {
      seq.counter = 1;
      seq.era += 1;
    }

    await seq.save();
  }

  // 5️⃣ Format NUBAN parts
  const eraStr = String(seq.era).padStart(2, "0");
  const counterStr = String(seq.counter).padStart(8, "0");

  return `${eraStr}${counterStr}`;
}