const sendSterlingMoney = async (req, res) => {
  const { bank, accountNumber, amount, narration } = req.body;

  try {
    console.log("Simulating transfer:", { bank, accountNumber, amount, narration });

    // Simulate transfer delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    res.status(200).json({ message: `₦${amount} sent to ${accountNumber} at ${bank}.` });
  } catch (error) {
    res.status(500).json({ message: 'Sterling Transfer failed.' });
  }
};

export default sendSterlingMoney;
