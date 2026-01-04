import Transaction from "../models/Transaction.js";

export const getDailyTransferTotal = async ({
  userId,
  type, // "A2A" or "TO_BANK"
}) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const result = await Transaction.aggregate([
    {
      $match: {
        userId,
        type,
        status: "SUCCESS",
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  return result[0]?.total || 0;
};