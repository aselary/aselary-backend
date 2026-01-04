import SignalFeed from "../models/signalFeed.js";

// Create Signal
export const createSignal = async (req, res) => {
  try {
    const { type, message, source } = req.body;
    const newSignal = new SignalFeed({ type, message, source });
    await newSignal.save();
    res.status(201).json(newSignal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Signals
export const getSignals = async (req, res) => {
  try {
    const signals = await SignalFeed.find().sort({ timestamp: -1 });
    res.status(200).json(signals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
