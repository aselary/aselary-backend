export const WITHDRAW_FEE = {
 calculate(amount) {

    amount = Number(amount);
    if (!amount || amount <= 0) return 0;

    let percent = 0;
    let cap = 0;

    // 🟢 SMALL USERS (₦1k – ₦50k)
    if (amount <= 50000) {
      percent = 1.7;
      cap = 1500;
    }

    // 🟡 MID USERS (₦50k – ₦500k)
    else if (amount <= 500000) {
      percent = 1.7;
      cap = 7000;
    }

    // 🔵 BIG USERS (₦500k – ₦2M)
    else if (amount <= 2000000) {
      percent = 1.7;
      cap = 20000;
    }

    // 👑 MEGA USERS (₦2M+)
    else {
      percent = 1.7;
      cap = 50000;
    }

    // calculate fee
    let fee = Math.floor((amount * percent) / 100);

    // apply cap
    return Math.min(fee, cap);
  }
};