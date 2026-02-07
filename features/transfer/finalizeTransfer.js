import isDev from "../utils/isDev.js";
import { paystackFetch } from "../paystack.js";

export const finalizePaystackTransfer = async ({ transferCode, otp }) => {
  // ✅ MOCK FOR DEV / LOCAL
  if (isDev) {
    return {
      status: "success",
      transferCode,
      completedAt: new Date().toISOString(),
      raw: {
        status: "success",
        message: "Mock OTP verification successful",
      },
    };
  }

  // 🔴 REAL PAYSTACK (PRODUCTION ONLY)
  const response = await paystackFetch("/transfer/finalize_transfer", {
    method: "POST",
    body: {
      transfer_code: transferCode,
      otp,
    },
  });

  if (!response.data.status) {
    throw new Error(
      response.data.message || "OTP verification failed"
    );
  }


  return response.data.data;
};