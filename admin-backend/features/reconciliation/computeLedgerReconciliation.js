import LedgerReconciliation from "../../../models/LedgerReconciliation.js";
import SettlementRecord from "../../../features/models/SettlementRecord.js";
import TreasuryPayout from "../../../features/models/TreasuryPayout.js";

export async function computeLedgerReconciliation(settlementRef) {
  if (!settlementRef) {
    throw new Error("settlementRef is required for reconciliation");
  }

  // 1️⃣ Fetch settlement
  const settlement = await SettlementRecord.findOne({ settlementRef });
  if (!settlement) {
    throw new Error("Settlement not found");
  }

  // 2️⃣ Platform ledger amount (already computed earlier in your system)
  const ledgerTotal = Number(settlement.ledgerAmount || 0);

  // 3️⃣ Sum executed treasury payouts
  const payoutAgg = await TreasuryPayout.aggregate([
    {
      $match: {
        settlementRef,
        payoutState: "PAID",
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  const payoutTotal = payoutAgg[0]?.total || 0;

  // 4️⃣ Paystack source amount
  const paystackAmount = Number(settlement.amount || 0);

  // 5️⃣ Final reconciliation math
  const difference = paystackAmount - ledgerTotal - payoutTotal;

  const reconciliationStatus = difference === 0 ? "MATCH" : "MISMATCH";

  // 6️⃣ Persist reconciliation result
  const reconciliation = await LedgerReconciliation.findOneAndUpdate(
    { settlementRef },
    {
      settlementRef,
      paystackAmount,
      ledgerTotal,
      payoutTotal,
      difference,
      reconciliationStatus,
      locked: reconciliationStatus === "BALANCED",
      computedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return reconciliation;
}