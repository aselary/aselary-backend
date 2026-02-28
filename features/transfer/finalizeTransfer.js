import isDev from "../utils/isDev.js";
import { paystackFetch } from "../paystack.js";
import TransferOTP from "../models/transferOtpModel.js";

export const finalizePaystackTransfer = async ({ transferCode, otp }) => {

  // 🔐 STEP 1 — VERIFY OUR OWN OTP
  const otpRecord = await TransferOTP.findOne({
    otp: otp,
    used: false,
    expiresAt: { $gt: new Date() }
  });

  if (!otpRecord) {
    throw new Error("Invalid or expired OTP");
  }

  // 🧪 DEV MODE (LOCAL TEST)
  if (isDev) {
    otpRecord.used = true;
    await otpRecord.save();

    return {
      status: "success",
      transferCode,
      completedAt: new Date().toISOString(),
      raw: {
        status: "success",
        message: "Mock transfer successful (DEV MODE)"
      }
    };
  }

  // 🟢 REAL PAYSTACK TRANSFER (NO PAYSTACK OTP AGAIN)
  const response = await paystackFetch("/transfer/finalize_transfer", {
    method: "POST",
    body: {
      transfer_code: transferCode
      // ❌ REMOVE otp from here completely
    }
  });

  if (!response.data.status) {
    throw new Error(response.data.message || "Transfer failed");
  }

  // ✅ MARK OTP USED AFTER SUCCESS
  otpRecord.used = true;
  await otpRecord.save();

  return response.data.data;
};