import SignalNode from "../models/signalNode.js";
import isDev from "../../../features/utils/isDev.js";

// CREATE
export const createSignalNode = async (req, res) => {
  try {
    const { nodeName, nodeLevel, frequency, signalType, status } = req.body;

    const newNode = new SignalNode({
      nodeName,
      nodeLevel,
      frequency,
      signalType,
      status,
    });

    await newNode.save();
    res.status(201).json(newNode);
  } catch (err) {
        if (isDev) {
    console.error('Create Error:', err);
        }
    res.status(500).json({ message: 'Server error creating node' });
  }
};


// GET ALL
export const getSignalNodes = async (req, res) => {
  try {
    const nodes = await SignalNode.find().sort({ createdAt: -1 });
    res.status(200).json({ nodes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE
export const deleteSignalNode = async (req, res) => {
  try {
    await SignalNode.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Delete successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// TOGGLE ACTIVE STATE
export const toggleSignalNode = async (req, res) => {
  try {
    const node = await SignalNode.findById(req.params.id);
    node.status = !node.status;
    await node.save();
    res.status(200).json({ success: true, node });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


