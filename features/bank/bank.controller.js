import axios from "axios";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const USE_MOCK_BANK = process.env.USE_MOCK_BANK === "true";

export const getBanks = async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.paystack.co/bank",
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    return res.json({
      success: true,
      data: response.data.data.map(bank => ({
        name: bank.name,
        code: bank.code,
      })),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch banks",
    });
  }
};

export const resolveBankAccount = async (req, res) => {
    console.log("BODY:", req.body);
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
    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    return res.json({
      success: true,
      accountName: response.data.data.account_name,
    });
  } catch (err) {
  console.error("PAYSTACK ERROR:", err.response?.data || err.message);

  return res.status(err.response?.status || 500).json({
    success: false,
    message:
      err.response?.data?.message ||
      "Unable to resolve account",
  });
}
};