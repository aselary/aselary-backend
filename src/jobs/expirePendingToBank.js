import ToBankTransaction from "../../features/models/ToBankTransaction.js";
import { failToBankTransferInternal } from "../services/failToBankInternal.js";

export const expirePendingToBank = async () => {
  const timeout = new Date(Date.now() - 60 * 1000); // 60 seconds

  const stuckTxns = await ToBankTransaction.find({
    status: "PENDING",
    createdAt: { $lt: timeout },
  });

  for (const tx of stuckTxns) {
    await failToBankTransferInternal(
      tx.reference,
      "Transfer timed out"
    );
  }
};