import { paystackFetch } from "../services/paystack.js";
import isDev from "../utils/isDev.js";


export const createTransferRecipient = async ({
  name,
  accountNumber,
  bankCode,
}) => {

   // ✅ MOCK FOR DEV / LOCAL
  if (isDev) {
    return {
      recipientCode: "RCP_TEST_FAKE_001",
      name,
      accountNumber,
      bankCode,
      currency: "NGN",
      isMock: true,
      createdAt: new Date().toISOString(),
    };
  }

  const response = await paystackFetch("/transferrecipient", {
    method: "POST",
    body: {
    type: "nuban",
    name,
    account_number: accountNumber,
    bank_code: bankCode,
    currency: "NGN",
    }
  });

  if (!response.status) {
    throw new Error("Failed to create transfer recipient");
  }

  return response.data.recipient_code;
};