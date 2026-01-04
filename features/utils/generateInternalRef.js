import crypto from "crypto";

export const generateInternalRef = (prefix = "TX") => {
  return `${prefix}_${crypto.randomUUID()}`;
};