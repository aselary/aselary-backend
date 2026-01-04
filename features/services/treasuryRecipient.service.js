const PAYSTACK_BASE = "https://api.paystack.co";

export async function createPaystackRecipient({
  name,
  bankCode,
  accountNumber,
}) {
  const res = await fetch(`${PAYSTACK_BASE}/transferrecipient`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "nuban",
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.status) {
    throw new Error(
      data?.message || "Failed to create Paystack transfer recipient"
    );
  }

  return data.data.recipient_code;
}