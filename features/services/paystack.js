const PAYSTACK_BASE =
  process.env.NODE_ENV === "production"
    ? "https://api.paystack.co"
    : "https://api.paystack.co";

export async function paystackFetch(path, options = {}) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "Paystack request failed");
  }

  return data;
}
