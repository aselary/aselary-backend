import ModePolarity from "../models/modePolarity.js";

// GET current polarity
export const getPolarity = async (req, res) => {
  try {
    const polarity = await ModePolarity.findOne();
    if (!polarity) {
      const created = await ModePolarity.create({ modePolarity: "Yin" });
      return res.status(200).json(created);
    }
    res.status(200).json(polarity);
  } catch (err) {
    res.status(500).json({ error: "Failed to get polarity" });
  }
};

// UPDATE polarity
export const updatePolarity = async (req, res) => {
  try {
    const { modePolarity } = req.body;
    const updated = await ModePolarity.findOneAndUpdate(
      {},
      { modePolarity },
      { new: true, upsert: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update polarity" });
  }
};
