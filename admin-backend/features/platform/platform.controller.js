import PlatformLedger from "../../../features/models/PlatformLedger.js";

export const getPlatformLedger = async (req, res) => {
  const ledger = await PlatformLedger.find()
    .sort({ createdAt: -1 })
    .limit(200);

  const totals = await PlatformLedger.aggregate([
    {
      $group: {
        _id: "$direction",
        total: { $sum: "$amount" },
      },
    },
  ]);

  let credit = 0;
  let debit = 0;

  totals.forEach((t) => {
    if (t._id === "CREDIT") credit = t.total;
    if (t._id === "DEBIT") debit = t.total;
  });

  return res.json({
    success: true,
    balance: credit - debit,
    ledger,
  });
};