import { WITHDRAW_FEE } from "../../config/savingsFee.js";

export function calculateFee(amount) {
  if (!amount || amount <= 0) return 0;
  return WITHDRAW_FEE.calculate(amount);
}