import mongoose from "mongoose";
import ToBankTransaction from "../../features/models/ToBankTransaction.js";
import ActivityLog from "../../features/models/ActivityLog.js";

export async function failToBankTransferInternal(reference, reason) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tx = await ToBankTransaction
      .findOne({ reference, status: "PENDING" })
      .session(session);

    if (!tx) {
      await session.abortTransaction();
      return;
    }

    tx.status = "FAILED";
    tx.failureReason = reason;
    tx.failedAt = new Date();
    await tx.save({ session });

    await ActivityLog.findOneAndUpdate(
      { reference },
      { status: "FAILED", reason },
      { session }
    );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
  } finally {
    session.endSession();
  }
}