import paystackFetch from "../utils/paystackFetch.js";

export const finalizePaystackTransfer = async ({ transferCode }) => {

  if (!transferCode) {
    throw new Error("Transfer code missing");
  }

  // 🔵 CALL PAYSTACK FINALIZE
  const response = await paystackFetch("/transfer/finalize_transfer", {
    method: "POST",
    body: {
      transfer_code: transferCode
    }
  });

  if (!response.data.status) {
    throw new Error(response.data.message || "Transfer failed");
  }

  return {
    status: "success",
    transferCode,
    completedAt: new Date().toISOString(),
    raw: response.data
  };
};