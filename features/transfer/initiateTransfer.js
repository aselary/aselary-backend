import { paystackFetch } from "../services/paystack.js";

export const initiatePaystackTransfer = async ({
  amount,
  recipientCode,
  reference,
  reason,
}) => {

 const response = await paystackFetch("/transfer", {
  method: "POST",
  body: {
    source: "balance",
    amount: amount * 100,
    recipient: recipientCode,
    reason,
    reference,
  },
});

if (!response.data.status) {
  throw new Error("Paystack transfer failed to start");
}

return {
  status: response.data.data.status,           // otp | pending | success
  transferCode: response.data.data.transfer_code,
  requiresOtp: response.data.data.status === "otp",
};
};