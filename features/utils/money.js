// utils/money.js
export const nairaToKobo = (n) => Math.round(Number(n) * 100);
export const koboToNaira = (k) => (Number(k) / 100).toFixed(2);
