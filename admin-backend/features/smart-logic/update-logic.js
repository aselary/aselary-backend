import SmartLogic from "../models/logic.model.js";

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.params; // ✅ Use req.params instead of req.query

  if (method === "PUT") {
    try {
      const updatedLogic = await SmartLogic.findByIdAndUpdate(id, req.body, {
        new: true,
      });

      if (!updatedLogic) {
        return res.status(404).json({ success: false, message: "Logic not found" });
      }

      res.status(200).json({ success: true, data: updatedLogic });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  } else {
    res.status(405).json({ success: false, message: "Method not allowed" });
  }
}
