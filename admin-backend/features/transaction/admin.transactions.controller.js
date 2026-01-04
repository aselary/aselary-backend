import Transaction from "../../../features/models/Transaction.js";
import isDev from "../../../features/utils/isDev.js";

export const getAllAdminTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ direction: "DEBIT"})
      .populate("userId", "fullName email phone")
      .sort({ createdAt: -1 })
      .limit(200);

    return res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
        if (isDev) {
    console.error("ADMIN_TRANSACTION_ERROR:", error);
        }
    return res.status(500).json({
      success: false,
      message: "Unable to fetch admin transactions",
    });
  }
};