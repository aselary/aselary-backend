import isDev from "../utils/isDev.js";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const USE_MOCK_BANK = process.env.USE_MOCK_BANK === "true";

export const getBanks = async (req, res) => {
  try {
   const response = await fetch("https://api.paystack.co/bank", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    "Content-Type": "application/json",
  },
});

const data = await response.json();

if (!response.ok) {
  throw new Error(data.message || "Failed to fetch banks");
}

  const banks = data.data.map(bank => ({
  name: bank.name,
  code: bank.code,
}));

return res.json({
  success: true,
  data: banks,
});
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch banks",
    });
  }
};

export const resolveBankAccount = async (req, res) => {
  if (isDev) {
    console.log("BODY:", req.body);
  }
  const { accountNumber, bankCode } = req.body;

  if (!accountNumber || !bankCode) {
    return res.status(400).json({
      success: false,
      message: "Account number and bank code required",
    });
  }

   // ✅ MOCK MODE (UNLIMITED TESTING)
  if (USE_MOCK_BANK) {
    return res.status(200).json({
      success: true,
      accountName: "TEST USER",
      accountNumber,
      bankCode,
      mock: true,
    });
  }

  try {
   const response = await fetch(
  `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
  }
);

const data = await response.json();

if (!response.ok) {
  throw new Error(data.message || "Unable to resolve account");
}
    return res.json({
      success: true,
      accountName: data.data.account_name,
    });
  } catch (err) {
  if (isDev) {
    console.error("PAYSTACK ERROR:", err.message);
  }

  return res.status(500).json({
    success: false,
    message: err.message || "Unable to resolve account",
  });
}
};