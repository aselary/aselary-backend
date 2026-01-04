import TreasuryRecipient from "../../../features/models/TreasuryRecipient.js";
import isDev from "../../../features/utils/isDev.js";

export const createTreasuryRecipient = async (req, res) => {
  try {
    const { bankCode, accountNumber } = req.body;

    if (!bankCode || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: "Bank code and account number are required",
      });
    }

    // 1️⃣ Resolve account with Paystack
    const resolveRes = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const resolved = await resolveRes.json();
    if (!resolved.status) {
      return res.status(400).json({
        success: false,
        message: "Account resolution failed",
      });
    }

    const accountName = resolved.data.account_name;

    // 2️⃣ Create Paystack recipient
    const recipientRes = await fetch(
      "https://api.paystack.co/transferrecipient",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "nuban",
          name: accountName,
          account_number: accountNumber,
          bank_code: bankCode,
          currency: "NGN",
        }),
      }
    );

    const recipientData = await recipientRes.json();
    if (!recipientData.status) {
      return res.status(400).json({
        success: false,
        message: "Failed to create Paystack recipient",
      });
    }

    // 3️⃣ Save locally
    const recipient = await TreasuryRecipient.create({
      bankCode,
      accountNumber,
      accountName,
      recipientCode: recipientData.data.recipient_code,
      active: true,
    });

    return res.json({
      success: true,
      message: "Treasury recipient created",
      data: recipient,
    });
  } catch (error) {
        if (isDev) {
    console.error("Create Treasury Recipient Error:", error);
        }
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


