import PlatformLedger from "../models/PlatformLedger.js";

const PAYSTACK_BASE = "https://api.paystack.co";

/**
 * PREVIEW settlement state
 * NO money movement
 * NO DB mutation
 */
export async function previewPlatformSettlement() {
  // 1️⃣ Fetch Paystack balance
  const res = await fetch(`${PAYSTACK_BASE}/balance`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Paystack balance");
  }

  const paystackData = await res.json();

  // Paystack returns balance in kobo
  const paystackBalance =
    Number(paystackData?.data?.[0]?.balance || 0) / 100;

  // 2️⃣ Calculate platform ledger total (ONLY platform fees)
  const ledgerEntries = await PlatformLedger.find({
    type: "PLATFORM_FEE",
    direction: "CREDIT",
  });

  const platformLedgerTotal = ledgerEntries.reduce(
    (sum, entry) => sum + Number(entry.amount || 0),
    0
  );

  // 3️⃣ Difference
  const difference = Number(
    (paystackBalance - platformLedgerTotal).toFixed(2)
  );

  return {
    success: true,
    paystackBalance,
    platformLedgerTotal,
    difference,
    status: difference === 0 ? "MATCH" : "MISMATCH",
  };
}