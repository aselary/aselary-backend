import { EARLY_WITHDRAWAL_PENALTY } from "../../config/penalty.js";

export function calculateEarlyWithdrawalPenalty(amount) {
  if (!amount || amount <= 0) return 0;
  
  return EARLY_WITHDRAWAL_PENALTY.calculate(amount);
}