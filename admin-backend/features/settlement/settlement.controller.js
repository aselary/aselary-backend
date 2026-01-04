import SettlementRecord from "../../../features/models/SettlementRecord.js";
import { reconcilePaystack } from "../reconciliation/reconcile.service.js";
import TreasuryAuditLog from "../../../features/models/TreasuryAuditLog.js";
import { assertValidTransition } from "../../../features/services/treasuryStateMachine.js";
import LedgerReconciliation from "../../../features/models/LedgerReconciliation.js";
import TreasuryPayout from "../../../features/models/TreasuryPayout.js";
import isDev from "../../../features/utils/isDev.js";

export const createSettlementRecord = async (req, res) => {
  try {
    // 1️⃣ Get reconciliation snapshot
    const snapshot = await reconcilePaystack();

    const {
      paystackBalance,
      platformLedgerTotal,
      difference,
      status,
    } = snapshot;

    // 2️⃣ Generate unique reference
    const reference = `SET-${Date.now()}`;

    // 3️⃣ Prevent duplicate unresolved settlement
    const existing = await SettlementRecord.findOne({
      settlementState: "CREATED",
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "There is already a pending settlement record",
      });
    }

    // 4️⃣ Save settlement record (LOCK SNAPSHOT)
    const record = await SettlementRecord.create({
      reference,
      paystackBalance,
      platformLedgerTotal,
      difference,
      reconciliationStatus: status,
      status: "PENDING",
      settlementState: "CREATED",
    });

    return res.status(201).json({
      success: true,
      message: "Settlement record created and locked",
      data: record,
    });
  } catch (error) {
         if (isDev) {
    console.error("Settlement Record Error:", error);
         }
    res.status(500).json({
      success: false,
      message: "Failed to create settlement record",
    });
  }
};


export const executeSettlement = async (req, res) => {
  try {
    const { reference, note } = req.body;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: "Settlement reference is required",
      });
    }

    const record = await SettlementRecord.findOne({ reference });


    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Settlement record not found",
      });
    }

    
    // 🔒 STEP 9.1 — GLOBAL LOCK GUARD
         if (record.isLocked === true) {
            return res.status(423).json({
              success: false,
               message: "Settlement is permanently locked and cannot be executed"
     });
    }
      // 🔁 STEP 9.2 — STATE TRANSITION GUARD
    if (record.status !== "PENDING") {
     return res.status(409).json({
    success: false,
    message: `Settlement cannot be executed from state ${record.status}`,
    });
  }

  // 🧮 STEP 9.3 — RECONCILIATION GATE
if (
  record.reconciliationStatus !== "MATCH" ||
  record.difference !== 0
) {
  return res.status(409).json({
    success: false,
    message: "Settlement reconciliation mismatch — execution blocked",
    meta: {
      reconciliationStatus: record.reconciliationStatus,
      difference: record.difference,
    },
  });
}

       // 🔐 STEP 9.4 — EXECUTION COMMIT (FINAL STATE WRITE)

record.status = "EXECUTED";
record.settlementState = "EXECUTED";
record.isLocked = true;
record.executedAt = new Date();

// optional admin/system note
if (note) {
  record.note = note;
}

// IMPORTANT: payout still NOT completed here
// payoutState stays UNPAID

await record.save();

// 🧪 STEP 9.5 — EXECUTION INTEGRITY ASSERTIONS
if (
  record.status !== "EXECUTED" ||
  record.settlementState !== "EXECUTED" ||
  record.isLocked !== true ||
  !record.executedAt ||
  record.payoutState !== "UNPAID"
) {
      if (isDev) {
  console.error("🚨 Settlement execution integrity failure", {
    reference: record.reference,
    status: record.status,
    settlementState: record.settlementState,
    isLocked: record.isLocked,
    executedAt: record.executedAt,
    payoutState: record.payoutState,
  });
}

  return res.status(500).json({
    success: false,
    message: "Settlement execution integrity violation",
  });
}


     await TreasuryAuditLog.create({
       action: "SETTLEMENT_EXECUTED",
       entity: "Settlement",
       entityId: record._id,
       performedBy: "SYSTEM",
       meta: {
       reference: record.reference,
       difference: record.difference,
        },
     });


    if (record.status !== "PENDING") {
      return res.status(409).json({
        success: false,
        message: "Settlement already executed or locked",
      });
    }
      
    const reconciliation = await LedgerReconciliation.findOne({
  settlementRef: record.reference,
});

if (!reconciliation || reconciliation.reconciliationStatus !== "MATCH") {
  return res.status(409).json({
    success: false,
    message: "Settlement reconciliation mismatch — execution blocked",
  });
}

    assertValidTransition(record.settlementState, "EXECUTED");

    // 🔐 LOCK IT PERMANENTLY
    record.settlementState = "EXECUTED";
    record.isLocked = true;


    return res.status(200).json({
  success: true,
  message: "Settlement executed successfully",
  data: {
    reference: record.reference,
    status: record.status,
    settlementState: record.settlementState,
    isLocked: record.isLocked,
    executedAt: record.executedAt,
  },
});
  } catch (error) {
        if (isDev) {
    console.error("Execute Settlement Error:", error);
        }
    res.status(500).json({
      success: false,
      message: "Failed to execute settlement",
    });
  }
};


export const getSettlementHistory = async (req, res) => {
  try {
    const records = await SettlementRecord.find()
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Settlement history fetched successfully",
      count: records.length,
      data: records,
    });
  } catch (error) {
        if (isDev) {
    console.error("Fetch Settlement History Error:", error);
        }
    res.status(500).json({
      success: false,
      message: "Failed to fetch settlement history",
    });
  }
};



export const closeSettlementFinal = async (req, res) => {
  try {
    const { settlementId, note } = req.body;

    if (!settlementId) {
      return res.status(400).json({
        success: false,
        message: "settlementId is required",
      });
    }

    // 1️⃣ Fetch settlement
    const settlement = await SettlementRecord.findById(settlementId);
    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found",
      });
    }

    // 2️⃣ Prevent double close
    if (settlement.isLocked || settlement.status === "CLOSED") {
      return res.status(409).json({
        success: false,
        message: "Settlement already closed and locked",
      });
    }

    // 4️⃣ Reconciliation must exist & MATCH
    const reconciliation = await LedgerReconciliation.findOne({
      settlementRef: settlement.reference,
    });

    if (!reconciliation) {
      return res.status(409).json({
        success: false,
        message: "Ledger reconciliation not computed",
      });
    }

        // 3️⃣ Must be EXECUTED
    if (settlement.status !== "EXECUTED") {
      return res.status(409).json({
        success: false,
        message: "Settlement must be EXECUTED before closing",
      });
    }

    if (reconciliation.reconciliationStatus !== "MATCH") {
      return res.status(409).json({
        success: false,
        message: "Ledger mismatch — cannot close settlement",
        reconciliation,
      });
    }

    // 5️⃣ Ensure ALL payouts are PAID
    const unpaid = await TreasuryPayout.findOne({
      settlementRef: settlement.reference,
      payoutState: { $ne: "PAID" },
    });

    if (unpaid) {
      return res.status(409).json({
        success: false,
        message: "Not all payouts are completed",
      });
    }

    // 🔒 6️⃣ FINAL IMMUTABLE SEAL
    settlement.status = "CLOSED";
    settlement.settlementState = "CLOSED";
    settlement.isLocked = true;
    settlement.closedAt = new Date();
    settlement.closedBy = req.admin?.id || "system-admin";
    settlement.note = note || "Final settlement seal applied";

    await settlement.save();

    // 🧾 7️⃣ AUDIT LOG (IMMUTABLE)
    await TreasuryAuditLog.create({
      action: "SETTLEMENT_CLOSED",
      entity: "Settlement",
      entityId: settlement._id,
      performedBy: req.admin?.id || "system-admin",
      meta: {
        reference: settlement.reference,
        difference: settlement.difference,
        reconciliationId: reconciliation._id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Settlement CLOSED, SEALED, and LOCKED permanently",
      data: settlement,
    });
  } catch (error) {
        if (isDev) {
    console.error("Close Settlement Final Error:", error);
        }
    return res.status(500).json({
      success: false,
      message: "Failed to close settlement",
    });
  }
};