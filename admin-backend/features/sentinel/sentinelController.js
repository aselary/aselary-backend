import SentinelLogic from "../models/Sentinel.js";

export const createObscuraLogic = async (req, res) => {
  try {
    // 🔁 Convert string or boolean to real true/false (for toggle)
    req.body.autoReact = req.body.autoReact === true || req.body.autoReact === 'true';
    const newLogic = new SentinelLogic(req.body);
    await newLogic.save();
    res.status(201).json(newLogic);
  } catch (error) {
    res.status(500).json({ message: 'Create failed', error });
  }
};


// UPDATE
export const updateObscuraLogic = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await SentinelLogic.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error });
  }
};

// DELETE
export const deleteObscuraLogic = async (req, res) => {
  try {
    const { id } = req.params;
    await SentinelLogic.findByIdAndDelete(id);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error });
  }
};

// GET ALL
export const getObscuraLogics = async (req, res) => {
  try {
    const logics = await SentinelLogic.find().sort({ createdAt: -1 });
    res.status(200).json(logics);
  } catch (error) {
    res.status(500).json({ message: 'Fetch failed', error });
  }
};


export const toggleLogic = async (req, res) => {
 try {
    const logic = await SentinelLogic.findById(req.params.id);
    if (!logic) return res.status(404).json({ error: 'Logic not found' });

    logic.status = !logic.status;
    await logic.save();

    res.json(logic);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const editLogic = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await SentinelLogic.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Logic not found' });
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};



export const deleteLogic = async (req, res) => {
  try {
    const logic = await SentinelLogic.findByIdAndDelete(req.params.id);
    if (!logic) return res.status(404).json({ message: "Logic not found" });

    res.status(200).json({ message: "Logic deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};