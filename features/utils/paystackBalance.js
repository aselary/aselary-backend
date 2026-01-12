import axios from "axios";

export const getPaystackBalance = async () => {
  const response = await axios.get(
    "https://api.paystack.co/balance",
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  const balances = response.data.data;

  // NGN balance only
  const ngnBalance = balances.find(b => b.currency === "NGN");

  return ngnBalance ? ngnBalance.balance / 100 : 0;
};