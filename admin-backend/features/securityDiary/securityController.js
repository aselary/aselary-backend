import SecurityDiary from '../models/securityDiary.js';

// CREATE
export const createObscuraLogic = async (req, res) => {
  try {
    const newLogic = new SecurityDiary(req.body);
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
    const updated = await SecurityDiary.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error });
  }
};

// DELETE
export const deleteObscuraLogic = async (req, res) => {
  try {
    const { id } = req.params;
    await SecurityDiary.findByIdAndDelete(id);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error });
  }
};

// GET ALL
export const getObscuraLogics = async (req, res) => {
  try {
    const logics = await SecurityDiary.find().sort({ createdAt: -1 });
    res.status(200).json(logics);
  } catch (error) {
    res.status(500).json({ message: 'Fetch failed', error });
  }
};


export const toggleLogic = async (req, res) => {
 try {
    const logic = await SecurityDiary.findById(req.params.id);
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

    const updated = await SecurityDiary.findByIdAndUpdate(id, updates, {
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
    const logic = await SecurityDiary.findByIdAndDelete(req.params.id);
    if (!logic) return res.status(404).json({ message: "Logic not found" });

    res.status(200).json({ message: "Logic deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};