export const EARLY_WITHDRAWAL_PENALTY = {
  PERCENT: 5,      // 5%
  CAP: 30000,       // ₦30,000 max
  calculate(amount) {
    let penalty = Math.floor((amount * this.PERCENT) / 100);
    return Math.min(penalty, this.CAP);
  }
};