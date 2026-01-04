import SmartLogic from "../models/logic.model.js";

export const deleteLogic = async (req, res) => {
  try {
    const logic = await SmartLogic.findByIdAndDelete(req.params.id);
    if (!logic) return res.status(404).json({ message: "Logic not found" });

    res.status(200).json({ message: "Logic deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
