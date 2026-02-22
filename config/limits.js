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
    maxPerTransaction: 5_000_000,
    maxDailyTotal: 10_000_000,
    maxSameBankPerDay: 2,
    cooldown: {
      thresholdAmount: 2_000_000, // stricter
      minutes: 30, // 30 mins cooldown
    },
  },
};