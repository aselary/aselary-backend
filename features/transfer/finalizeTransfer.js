import { paystackFetch } from "../paystack.js";

export const finalizePaystackTransfer = async ({ transferCode, otp }) => {
  const response = await paystackFetch("/transfer/finalize_transfer", {
    method: "POST",
    body: {
      transfer_code: transferCode,
      otp,
    },
  });

  if (!response.data.status) {
    throw new Error(response.data.message || "OTP verification failed");
  }

  return response.data.data;
};