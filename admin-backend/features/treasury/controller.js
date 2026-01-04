import Total from "../models/Total.js"; // or wherever your User schema is

export const getTotalSavings = async (req, res) => {
  try {
    // Sum up all users' savings balance
    const result = await Total.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$savingsBalance" },
        },
      },
    ]);

    const total = result[0]?.total || 0;
    res.status(200).json({ total });
  } catch (error) {
    console.error("Error calculating total savings:", error);
    res.status(500).json({ error: "Failed to fetch total savings" });
  }
};



export const getCurrentBalance = async (req, res) => {
  try {
    // Simulated fixed balance for now
    const balance = 795000; // Later we'll fetch from Sterling's API
    res.status(200).json({ balance });
  } catch (error) {
    console.error("Error fetching admin balance:", error);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
};
