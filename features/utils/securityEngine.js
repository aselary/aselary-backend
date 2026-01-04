export function calculateRisk({
  amount,
  userId,
  ip,
  userAgent,
  attempts,
}) {
  let score = 0;

  // =========================
  // HARD AMOUNT RULES (BLOCK)
  // =========================
  if (!amount || isNaN(amount)) {
    return { blocked: true, reason: "Invalid amount", score: 100 };
  }

  if (amount < 100) {
    return { blocked: true, reason: "Amount below minimum", score: 100 };
  }

  if (amount > 1_000_000) {
    return { blocked: true, reason: "Amount exceeds limit", score: 100 };
  }

  // =========================
  // RISK SCORING (VERSION 1)
  // =========================

  // Amount-based risk (NOT blocking)
  if (amount > 50_000) score += 10;
  if (amount > 200_000) score += 20;
  if (amount > 500_000) score += 35;

  // Velocity checks
  if (attempts > 5) score += 20;
  if (attempts > 10) score += 40;

  // Bot / script detection
  if (/curl|python|bot|scraper/i.test(userAgent)) score += 60;

  // Missing IP
  if (!ip) score += 20;

  // Clamp score
  if (score > 100) score = 100;

  return {
    blocked: score >= 80, // 🚨 block only if VERY risky
    reason: score >= 80 ? "High risk transfer detected" : null,
    score,
  };
}