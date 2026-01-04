import TreasuryPayout from "../../../features/models/TreasuryPayout.js";
import SettlementRecord from "../../../features/models/SettlementRecord.js";
import isDev from "../../../features/utils/isDev.js";

export const createPayoutFromExecutedSettlement = async (req, res) => {
  try {
    const { settlementRef, note } = req.body;

    if (!settlementRef) {
      return res.status(400).json({
        success: false,
        message: "settlementId is required",
      });
    }

    // 1️⃣ Fetch settlement
    const settlement = await SettlementRecord.findOne({ reference: settlementRef });

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found",
      });
    }

    // 2️⃣ Must NOT be closed
    if (settlement.status === "CLOSED") {
      return res.status(409).json({
        success: false,
        message: "Settlement already CLOSED",
      });
    }

    // 3️⃣ Must be EXECUTED
    if (settlement.status !== "EXECUTED") {
      return res.status(409).json({
        success: false,
        message: "Settlement must be EXECUTED before creating payout",
      });
    }

    // 4️⃣ Reconciliation must MATCH
    if (settlement.reconciliationStatus !== "MATCH" || settlement.difference !== 0) {
      return res.status(409).json({
        success: false,
        message: "Ledger mismatch — payout creation blocked",
        meta: {
          reconciliationStatus: settlement.reconciliationStatus,
          difference: settlement.difference,
        },
      });
    }

    // 5️⃣ Prevent duplicate payout
    const existingPayout = await TreasuryPayout.findOne({
      settlementRef: settlement.reference,
    });

    if (existingPayout) {
      return res.status(409).json({
        success: false,
        message: "Payout already created for this settlement",
      });
    }

    // 6️⃣ Create payout
    const payout = await TreasuryPayout.create({
      settlementRef: settlement.reference,
      amount: settlement.platformLedgerTotal,
      payoutState: "UNPAID",
      status: "CREATED",
      createdBy: req.admin?.id || "system-admin",
      note: note || "Payout created from executed settlement",
    });

    // 7️⃣ Link payout to settlement (optional but powerful)
    settlement.payoutState = "CREATED";
    settlement.payoutRef = payout._id;
    await settlement.save();

    // 8️⃣ Audit log (IMMUTABLE)
    await TreasuryAuditLog.create({
      action: "PAYOUT_CREATED",
      entity: "TreasuryPayout",
      entityId: payout._id,
      performedBy: req.admin?.id || "system-admin",
      meta: {
        settlementRef: settlement.reference,
        payoutAmount: payout.amount,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Payout created successfully",
      data: {
        payoutId: payout._id,
        settlementRef: settlement.reference,
        payoutState: payout.payoutState,
        amount: payout.amount,
      },
    });
  } catch (error) {
    if (isDev) {
    console.error("Create Payout Error:", error);
    }
    return res.status(500).json({
      success: false,
      message: "Failed to create payout",
    });
  }
};