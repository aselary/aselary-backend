import VibeShield from '../../models/vibeshield.js';

export const toggleVibeShield = async (req, res) => {
  try {
    let doc = await VibeShield.findOne();
    if (!doc) doc = new VibeShield();

    doc.isActive = !doc.isActive;
    doc.updatedAt = new Date();
    await doc.save();

    res.json({ isActive: doc.isActive });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle VibeShield' });
  }
};

export const getVibeShieldStatus = async (req, res) => {
  try {
    let doc = await VibeShield.findOne();
    if (!doc) doc = new VibeShield({ isActive: false });
    res.json({ isActive: doc.isActive });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
};
