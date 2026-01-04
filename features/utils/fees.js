export function computeExternalFee(amountKobo) {
  // Example: 0.5% + ₦10, capped at ₦2,000
  const pct = Math.round(amountKobo * 0.005);
  const fixed = 10 * 100;
  const cap = 2000 * 100;
  return Math.min(pct + fixed, cap);
}
