// backend/features/system-setting/cipherkeyController.js
import CipherKeyModel from '../models/cipherKey.js';

export const getCipherKey = async (req, res) => {
  try {
    const keyDoc = await CipherKeyModel.findOne({});
    res.status(200).json(keyDoc || {});
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCipherKey = async (req, res) => {
  try {
    const { key } = req.body;
    let existing = await CipherKeyModel.findOne({});
    if (existing) {
      existing.key = key;
      await existing.save();
    } else {
      await CipherKeyModel.create({ key });
    }
    res.status(200).json({ message: 'CipherKey saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error saving key' });
  }
};
