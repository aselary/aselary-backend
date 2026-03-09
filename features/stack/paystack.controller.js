import fetch from "node-fetch"
import isDev from "../utils/isDev.js";

export const createPaystackCustomer = async (user) => {
  if (!user?.email || !user?.fullName || !user?.phoneNumber) {
    throw new Error("Missing required user data for Paystack customer");
  }

  const [firstName, ...rest] = user.fullName.split(" ");
  const lastName = rest.join(" ") || "User";

  const response = await fetch("https://api.paystack.co/customer", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      phone: user.phoneNumber,
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    if (isDev) {
    console.error("PAYSTACK CUSTOMER ERROR:", json);
    }
    throw new Error(json.message || "Paystack customer creation failed");
  }

  return json.data.customer_code;
};

/* =====================================================
   CREATE PAYSTACK DEDICATED ACCOUNT
===================================================== */
export const createDedicatedAccount = async (customerCode) => {
  
  if (!customerCode) {
    throw new Error("Paystack customer code is required");
  }

const isPaystackLive =
  process.env.PAYSTACK_SECRET_KEY?.startsWith("sk_live");

const body = {
  customer: customerCode,
};

if (isPaystackLive) {
  body.preferred_bank = "paystack-titan";
}


if (isDev) {
console.log("Creating Paystack Dedicated Account...");
console.log("Request body:", body);
}

  const response = await fetch(
    "https://api.paystack.co/dedicated_account",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const json = await response.json();

  if (isDev) {
  console.log("PAYSTACK DVA RESPONSE:", json);
  }

  if (!response.ok) {
    if (isDev) {
    console.error("PAYSTACK DEDICATED ERROR:", json);
    }
    throw new Error(json.message || "Paystack dedicated account failed");
  }

  return {
    accountNumber: json.data.account_number,
    bankName: json.data.bank.name,
    accountName: json.data.account_name,
    provider: "paystack",
  };
};