// utils/tbLimits.js
export const TB_MIN = 100 * 100;          // ₦100
export const TB_MAX = 2_000_000 * 100;    // ₦2,000,000
export const TB_DAILY_OUTFLOW = 2_000_000 * 100; // adjust later
export const TB_DAILY_MAX_TX = 25;

export function calcTbFee(amount) {
  // simple: 0.5% capped at ₦200 + ₦10
  const pct = Math.round(amount * 0.005);
  const cap = 200 * 100;
  return Math.min(pct, cap) + (10 * 100);
}