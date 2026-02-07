export const WITHDRAW_FUND_FEES = [
  {
    min: 1,
    max: 4999,
    fee: 30,
  },
  {
    min: 5000,
    max: 19999,
    fee: 50,
  },
  
  {
    min: 20000,
    max:  59999,
    fee: 50,
  },

   {
    min: 60000,
    max: 199999,
    fee: 70,
  },

  {
    min: 200000,
    max: Infinity,
    fee: 120,
  },
];