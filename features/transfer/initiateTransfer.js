import isDev from "../utils/isDev.js";
import { paystackFetch } from "../services/paystack.js";

export const initiatePaystackTransfer = async ({
  amount,
  recipientCode,
  reference,
  reason,
}) => {
  // ✅ MOCK FOR DEV
  if (isDev) {
    return {
      status: "success",
      transferCode: "MOCK_TRF_" + Date.now(),
      requiresOtp: false,
      raw: {
        status: "success",
        message: "Mock transfer successful",
      },
    };
  }

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