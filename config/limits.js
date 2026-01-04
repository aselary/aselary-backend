export const LIMITS = {
  A2A: {
    maxPerTransaction: 150_000,
    maxDailyTotal: 400_000,
        // 2️⃣ Same receiver protection
    maxSameReceiverPerDay: 3,
    // 🔐 time lock only for big transfers
    cooldown: {
      thresholdAmount: 100_000, // only if ≥ this
      minutes: 60, // 1 hours
    },
  },

  TO_BANK: {
    maxPerTransaction: 100_000,
    maxDailyTotal: 200_000,
    maxSameBankPerDay: 2,
    cooldown: {
      thresholdAmount: 100_000, // stricter
      minutes: 60, // 1 hour
    },
  },
};