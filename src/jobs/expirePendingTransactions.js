import Transaction from "../../features/models/Transaction.js";
import isDev from "../../features/utils/isDev.js";

export const expirePendingTransactions = async () => {
  const EXPIRY_MINUTES = 10;

  const expiryTime = new Date(
    Date.now() - EXPIRY_MINUTES * 60 * 1000
  );

  const result = await Transaction.updateMany(
    {
      status: "pending",
      createdAt: { $lt: expiryTime },
    },
    {
      status: "failed",
    }
  );

  if (result.modifiedCount > 0) {
        if (isDev) {
    console.log(
      `[AUTO-EXPIRE] ${result.modifiedCount} pending transactions expired`
    );
  }
  }
};

