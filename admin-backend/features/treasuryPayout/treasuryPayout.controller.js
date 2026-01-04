import TreasuryPayout from "../../../features/models/TreasuryPayout.js";
import TreasuryRecipient from "../../../features/models/TreasuryRecipient.js";
import TreasuryExecutionLog from "../../../features/models/TreasuryExecutionLog.js";
import LedgerReconciliation from "../../../features/models/LedgerReconciliation.js";
import isDev from "../../../features/utils/isDev.js";


export const getTreasuryPayouts = async (req, res) => {
  try {
    const payouts = await TreasuryPayout
      .find()
      .populate("settlement")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payouts.length,
      data: payouts,
    });
  } catch (error) {
        if (isDev) {
    console.error("Fetch Treasury Payouts Error:", error);
        }
    return res.status(500).json({
      success: false,
      message: "Failed to fetch treasury payouts",
    });
  }
};



export const attachRecipientToPayout = async (req, res) => {
  try {
    const { payoutId, recipientId } = req.body;

    if (!payoutId || !recipientId) {
      return res.status(400).json({
        success: false,
        message: "payoutId and recipientId are required",
      });
    }

    const payout = await TreasuryPayout.findById(payoutId);
    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout not found" });
    }

    if (payout.payoutState !== "BLOCKED" && payout.payoutState !== "NO_RECIPIENT") {
      return res.status(409).json({
        success: false,
        message: "Only BLOCKED payouts can be unlocked",
      });
    }

    const recipient = await TreasuryRecipient.findById(recipientId);
    if (!recipient || !recipient.active) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive recipient",
      });
    }

    payout.recipientCode = recipient.recipientCode;
    payout.blockReason = null;
    payout.payoutState = "READY";
    payout.isLocked = false;

    await payout.save();

    return res.json({
      success: true,
      message: "Recipient attached. Payout ready for execution.",
      data: payout,
    });
  } catch (error) {
        if (isDev) {
    console.error("Attach Recipient Error:", error);
        }
    res.status(500).json({ success: false, message: "Failed to attach recipient" });
  }
};


export const executeTreasuryPayout = async (req, res) => {
  try {
    const { payoutId, note } = req.body;

    if (!payoutId) {
      return res.status(400).json({
        success: false,
        message: "payoutId is required",
      });
    }

    const payout = await TreasuryPayout.findById(payoutId);

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: "Payout not found",
      });
    }

    if (payout.payoutState !== "READY") {
      return res.status(409).json({
        success: false,
        message: "Payout is not ready for execution",
      });
    }

    if (!payout.recipientCode) {
      return res.status(409).json({
        success: false,
        message: "Recipient not attached",
      });
    }

    // 🔒 RECONCILIATION GUARD
const reconciliation = await LedgerReconciliation.findOne({
  settlementRef: payout.settlement,
});

if (!reconciliation) {
  return res.status(409).json({
    success: false,
    message: "Ledger reconciliation not computed for this settlement",
  });
}

if (reconciliation.status !== "BALANCED") {
  return res.status(409).json({
    success: false,
    message: "Ledger mismatch detected. Payout execution blocked",
    reconciliation,
  });
}

    // 🔒 LOCK + MARK AS PAID
   // 🔒 FINAL EXECUTION GUARD
if (payout.isLocked || payout.payoutState === "PAID") {
  return res.status(409).json({
    success: false,
    message: "Payout already executed and locked",
  });
}

// ✅ Mark payout as PAID
payout.payoutState = "PAID";
payout.isLocked = true;
payout.executedAt = new Date();
payout.note = note || "Admin executed payout";

await payout.save();

// 🧾 CREATE IMMUTABLE EXECUTION LOG
await TreasuryExecutionLog.create({
  payoutId: payout._id,
  payoutRef: payout.reference,
  amount: payout.amount,
  currency: payout.currency || "NGN",
  recipientCode: payout.recipientCode,
  executedBy: req.admin?.email || "system-admin",
  note: payout.note,
  payoutSnapshot: payout.toObject(),
});

    await payout.save();

    return res.json({
      success: true,
      message: "Payout executed successfully",
      data: payout,
    });
  } catch (error) {
       if (isDev) {
    console.error("Execute Payout Error:", error);
       }
    return res.status(500).json({
      success: false,
      message: "Failed to execute payout",
    });
  }
};

export const getTreasuryRecipients = async (req, res) => {
  try {
    const recipients = await TreasuryRecipient
      .find({ active: true })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: recipients.length,
      data: recipients,
    });
  } catch (error) {
        if (isDev) {
    console.error("Fetch Treasury Recipients Error:", error);
        }
    return res.status(500).json({
      success: false,
      message: "Failed to fetch treasury recipients",
    });
  }
};


export const getExecutionLogs = async (req, res) => {
  try {
    const { payoutRef } = req.query;

    const filter = payoutRef ? { payoutRef } : {};

    const logs = await TreasuryExecutionLog
      .find(filter)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
        if (isDev) {
    console.error("Execution logs error:", error);
        }
    res.status(500).json({
      success: false,
      message: "Failed to fetch execution logs",
    });
  }
};



