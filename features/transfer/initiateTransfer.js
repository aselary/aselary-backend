
import { paystackFetch } from "../services/paystack.js";

export const initiatePaystackTransfer = async ({
  amount,
  recipientCode,
  reference,
  reason,
}) => {
 

  // 🔴 REAL PAYSTACK (PRODUCTION ONLY)
  const response = await paystackFetch("/transfer", {
    method: "POST",
    body: {
      source: "balance",
      amount: amount * 100, // kobo
      recipient: recipientCode,
      reason,
      reference,
    },
  });

return {
  status: response.data.status,           // otp | pending | success
  transferCode: response.data.transfer_code,
  requiresOtp: response.data.status === "otp",
};
};