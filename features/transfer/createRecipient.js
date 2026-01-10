import { paystackFetch } from "../services/paystack.js";


export const createTransferRecipient = async ({
  name,
  accountNumber,
  bankCode,
}) => {

    if (process.env.NODE_ENV !== "production") {
  return "RCP_TEST_FAKE";
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

  if (!response.data.status) {
    throw new Error("Failed to create transfer recipient");
  }

  return response.data.data.recipient_code;
};