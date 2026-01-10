import { paystackFetch } from "../services/paystack.js";

export const initiatePaystackTransfer = async ({
  amount,
  recipientCode,
  reference,
  reason,
}) => {

      // ✅ TEST MODE: SIMULATE PAYSTACK SUCCESS
  if (process.env.NODE_ENV !== "production") {
    return {
      id: "TRF_TEST_FAKE",
      status: "success",
      reference,
      amount: amount * 100,
      recipient: recipientCode,
    };
  }
  
  const response = await paystackFetch("/transfer", {
    method: "POST",
    body: {
    source: "balance",
    amount: amount * 100, // naira → kobo
    recipient: recipientCode,
    reason,
    reference,
    }
  });

  if (!response.data.status) {
    throw new Error("Paystack transfer failed to start");
  }

  return response.data.data;
};