// smart-logic/controller/createLogic.controller.js
import SmartLogic from "../models/logic.model.js";
// Create Logic
export const createLogic = async (req, res) => {
  try {
    const logic = await SmartLogic.create(req.body);
    res.status(201).json(logic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All
export const getAllLogics = async (_req, res) => {
  try {
    const logics = await SmartLogic.find().sort({ createdAt: -1 });
    res.json(logics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Toggle On/Off
export const toggleLogic = async (req, res) => {
  try {
    const logic = await SmartLogic.findById(req.params.id);
    if (!logic) {
      return res.status(404).json({ error: 'Logic not found' });
    }

    logic.status = !logic.status;
    await logic.save();

    res.json({ success: true, logic });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

