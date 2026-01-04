export const calculateFee = (amount, feeTable) => {
  for (const tier of feeTable) {
    if (amount <= tier.max) return tier.fee;
  }
  return 0;
};