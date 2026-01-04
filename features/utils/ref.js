import { randomBytes } from "crypto";

export default function genRef(prefix = "ASL") {
  const r = randomBytes(6).toString("hex").toUpperCase();
  return `${prefix}-${Date.now().toString().slice(-6)}-${r}`;
}