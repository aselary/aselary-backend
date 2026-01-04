const getSterlingBalance = async (req, res) => {
  try {
    // Replace this later with real API logic
    const balance = "₦735.00"; // Simulated balance
    res.status(200).json({ balance });
  } catch (error) {
    console.error("Error fetching sterling balance:", error);
    res.status(500).json({ error: "Unable to fetch balance" });
  }
};

export default getSterlingBalance;
