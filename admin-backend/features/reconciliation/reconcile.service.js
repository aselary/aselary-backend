import PlatformLedger from "../../../features/models/PlatformLedger.js";
import ReconciliationAudit from "../../../features/models/ReconciliationAudit.js";

const PAYSTACK_BASE = "https://api.paystack.co";

export async function reconcilePaystack() {
  /** 1. Fetch Paystack balance */
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

  const paystackBalance =
    paystackData?.data?.[0]?.balance || 0;

  /** 2. Calculate platform ledger total */
  const ledger = await PlatformLedger.find({
    type: "PLATFORM_FEE",
    direction: "CREDIT",
  });

  const platformLedgerTotal = ledger.reduce(
    (sum, tx) => sum + Number(tx.amount || 0),
    0
  );

  /** 3. Compare */
  const difference = paystackBalance - platformLedgerTotal;

  return {
    paystackBalance,
    platformLedgerTotal,
    difference,
    status: difference === 0 ? "MATCH" : "MISMATCH",
  };
}


export async function forceAcceptReconciliation(req, res) {
  const { paystackBalance, platformLedgerTotal, difference, reason } = req.body;

  if (!reason || reason.length < 10) {
    return res.status(400).json({
      success: false,
      message: "Reason required (min 10 chars)",
    });
  }

  const audit = await ReconciliationAudit.create({
    paystackBalance,
    platformLedgerTotal,
    difference,
    status: "FORCE_ACCEPTED",
    reason,
    approvedBy: req.admin.id,
    locked: true,
  });

  res.json({
    success: true,
    message: "Reconciliation force-accepted",
    audit,
  });
}